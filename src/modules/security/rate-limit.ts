import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { sha256 } from '@/lib/ids';
import { env } from '@/lib/env';

export type RateResult = { ok: boolean; count: number; limit: number; retryAfterSec: number };

/**
 * Limitation de fréquence à fenêtre fixe, stockée en base (fonctionne aussi en environnement serverless).
 * La clé ne contient jamais de donnée personnelle en clair (adresse IP hachée avec un sel).
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateResult> {
  const db = await getDb();
  const rows = await db.execute<{ count: number; window_start: string | Date }>(sql`
    insert into rate_limits (key, window_start, count) values (${key}, now(), 1)
    on conflict (key) do update set
      count = case when rate_limits.window_start < now() - make_interval(secs => ${windowSec}) then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start < now() - make_interval(secs => ${windowSec}) then now() else rate_limits.window_start end
    returning count, window_start`);
  const row = (Array.isArray(rows) ? rows[0] : (rows as unknown as { rows: { count: number; window_start: string | Date }[] }).rows[0]);
  const count = Number(row.count);
  const start = new Date(row.window_start).getTime();
  const retryAfterSec = Math.max(1, Math.ceil((start + windowSec * 1000 - Date.now()) / 1000));
  return { ok: count <= limit, count, limit, retryAfterSec };
}

export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'local';
}

/** Empreinte non réversible d'une IP ou d'une donnée sensible, pour les clés et journaux. */
export const fingerprint = (value: string) => sha256(`${env.hashSalt}:${value}`).slice(0, 32);
