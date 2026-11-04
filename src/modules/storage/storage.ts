import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '@/lib/env';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Détermine le type réel d'un fichier à partir de sa signature (on ne fait pas confiance au type annoncé). */
export function sniffImageType(buf: Uint8Array): (typeof ALLOWED_IMAGE_TYPES)[number] | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  const ascii = (a: number, b: number) => String.fromCharCode(...buf.slice(a, b));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 8) === 'ftyp' && ['heic', 'heix', 'mif1', 'msf1', 'heim', 'heis'].includes(ascii(8, 12))) return 'image/heic';
  return null;
}

export const extensionFor = (mime: string) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' }[mime] ?? 'bin');

export interface StorageAdapter {
  readonly name: string;
  put(key: string, data: Uint8Array, mime: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
}

/** Stockage disque, hors du dossier public : les fichiers ne sont servis qu'après contrôle d'accès. */
const localStorage: StorageAdapter = {
  name: 'local',
  async put(key, data) {
    const p = safePath(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, data, { mode: 0o600 });
  },
  async get(key) {
    try { return new Uint8Array(await fs.readFile(safePath(key))); } catch { return null; }
  },
  async remove(key) { await fs.rm(safePath(key), { force: true }); },
};

function safePath(key: string) {
  if (!/^[a-z0-9/_-]+\.[a-z0-9]+$/i.test(key) || key.includes('..')) throw new Error('Clé de stockage invalide');
  return path.join(path.resolve(env.uploadDir), key);
}

/** Supabase Storage (bucket privé) via l'API REST. Non testé avec un compte réel. */
const supabaseStorage: StorageAdapter = {
  name: 'supabase',
  async put(key, data, mime) {
    const res = await fetch(`${env.supabaseUrl}/storage/v1/object/${env.supabaseBucket}/${key}`, {
      method: 'POST', headers: { Authorization: `Bearer ${env.supabaseServiceKey}`, 'Content-Type': mime, 'x-upsert': 'false' }, body: Buffer.from(data),
    });
    if (!res.ok) throw new Error(`Supabase storage ${res.status}`);
  },
  async get(key) {
    const res = await fetch(`${env.supabaseUrl}/storage/v1/object/authenticated/${env.supabaseBucket}/${key}`, { headers: { Authorization: `Bearer ${env.supabaseServiceKey}` } });
    return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
  },
  async remove(key) {
    await fetch(`${env.supabaseUrl}/storage/v1/object/${env.supabaseBucket}/${key}`, { method: 'DELETE', headers: { Authorization: `Bearer ${env.supabaseServiceKey}` } });
  },
};

export const getStorage = (): StorageAdapter => (env.storageProvider === 'supabase' ? supabaseStorage : localStorage);
