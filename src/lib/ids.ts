import { randomBytes, randomUUID, createHash } from 'node:crypto';

export const newId = () => randomUUID();
export const newToken = (bytes = 24) => randomBytes(bytes).toString('base64url');
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function randomCode(len: number) {
  const buf = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[buf[i] % ALPHABET.length];
  return out;
}

/** Référence lisible de demande : VF-AAMM-XXXX (sans caractères ambigus). */
export function bookingReference(date = new Date()) {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `VF-${yy}${mm}-${randomCode(4)}`;
}
