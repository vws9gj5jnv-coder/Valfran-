import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';

/** Hachage scrypt (paramètres OWASP : N=2^17, r=8, p=1). Format : scrypt$N$r$p$sel$hash */
const N = 2 ** 17, R = 8, P = 1, KEYLEN = 64;

function derive(password: string, salt: Buffer, n: number, r: number, p: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize('NFKC'), salt, KEYLEN, { N: n, r, p, maxmem: 256 * 1024 * 1024 }, (err, key) => (err ? reject(err) : resolve(key))));
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const expected = Buffer.from(parts[5], 'base64');
  const key = await derive(password, Buffer.from(parts[4], 'base64'), Number(parts[1]), Number(parts[2]), Number(parts[3]));
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function passwordProblems(pw: string): string | null {
  if (pw.length < 12) return 'Le mot de passe doit contenir au moins 12 caractères.';
  if (pw.length > 200) return 'Mot de passe trop long.';
  if (/^(.)\1+$/.test(pw)) return 'Mot de passe trop simple.';
  return null;
}
