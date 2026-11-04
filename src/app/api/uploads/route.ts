import { getDb } from '@/db/client';
import { attachments } from '@/db/schema';
import { getStorage, sniffImageType, extensionFor, MAX_UPLOAD_BYTES } from '@/modules/storage/storage';
import { rateLimit, clientIp, fingerprint } from '@/modules/security/rate-limit';
import { json, forbidden, sameOrigin } from '@/lib/http';
import { newId } from '@/lib/ids';

/** Envoi d'une photo (jointe ensuite à la demande). Type vérifié par signature, nom de fichier aléatoire. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const rl = await rateLimit(`upload:${fingerprint(clientIp(req.headers))}`, 20, 3600);
  if (!rl.ok) return json({ error: 'rate_limited', message: 'Trop d’envois. Réessayez plus tard.' }, 429);
  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > MAX_UPLOAD_BYTES + 10_000) return json({ error: 'too_large', message: 'Photo trop lourde (8 Mo maximum).' }, 413);
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return json({ error: 'invalid', message: 'Aucun fichier reçu.' }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: 'too_large', message: 'Photo trop lourde (8 Mo maximum).' }, 413);
  const buf = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageType(buf);
  if (!mime) return json({ error: 'type', message: 'Format accepté : photo JPEG, PNG, WebP ou HEIC.' }, 415);
  const id = newId();
  const d = new Date();
  const key = `requests/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${id}.${extensionFor(mime)}`;
  await getStorage().put(key, buf, mime);
  const db = await getDb();
  const safeName = file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 80);
  await db.insert(attachments).values({ id, storageKey: key, mime, size: buf.length, originalName: safeName });
  return json({ id, name: safeName, size: buf.length }, 201);
}
