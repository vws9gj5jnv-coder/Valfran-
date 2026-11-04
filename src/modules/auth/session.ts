import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, gt, lt } from 'drizzle-orm';
import { cache } from 'react';
import { getDb } from '@/db/client';
import { adminUsers, sessions, auditLog } from '@/db/schema';
import { newToken, sha256 } from '@/lib/ids';
import { env } from '@/lib/env';

export const SESSION_COOKIE = env.isProd ? '__Host-vf_admin' : 'vf_admin';
const SESSION_HOURS = 12;

export async function createSession(userId: string) {
  const db = await getDb();
  const token = newToken(32);
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000);
  const ua = (await headers()).get('user-agent')?.slice(0, 200) ?? '';
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt, userAgent: ua });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: env.isProd, sameSite: 'lax', path: '/', expires: expiresAt });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  }
  jar.delete(SESSION_COOKIE);
}

export type AdminUser = { id: string; email: string; name: string; role: string; isDemo: boolean };

/** Utilisateur connecté (ou null). Mis en cache pour la durée de la requête. */
export const currentAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const rows = await db
    .select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, role: adminUsers.role, isDemo: adminUsers.isDemo })
    .from(sessions).innerJoin(adminUsers, eq(sessions.userId, adminUsers.id))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())));
  return rows[0] ?? null;
});

/** À appeler dans chaque page, action serveur et route d'administration. */
export async function requireAdmin(): Promise<AdminUser> {
  const u = await currentAdmin();
  if (!u) redirect('/admin/connexion');
  return u;
}

export async function audit(actor: string, action: string, entity: string, entityId = '') {
  try {
    const db = await getDb();
    await db.insert(auditLog).values({ actor, action, entity, entityId });
  } catch { /* journal non bloquant */ }
}
