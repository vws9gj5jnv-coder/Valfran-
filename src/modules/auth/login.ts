'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { adminUsers } from '@/db/schema';
import { verifyPassword, hashPassword, passwordProblems } from './password';
import { createSession, destroySession, audit, requireAdmin } from './session';
import { rateLimit, clientIp, fingerprint } from '@/modules/security/rate-limit';

export type LoginState = { error?: string };

const LOCK_AFTER = 8;
const LOCK_MINUTES = 15;
// Hachage factice pour égaliser le temps de réponse lorsqu'un compte n'existe pas.
let dummyHash: Promise<string> | null = null;

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase().slice(0, 200);
  const password = String(form.get('password') ?? '').slice(0, 200);
  const ip = clientIp(await headers());
  const rl = await rateLimit(`login:${fingerprint(ip)}`, Number(process.env.LOGIN_ATTEMPTS_PER_15MIN ?? 10), 900);
  if (!rl.ok) return { error: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfterSec / 60)} minutes.` };
  if (!email || !password) return { error: 'Saisissez votre e-mail et votre mot de passe.' };

  const db = await getDb();
  const user = (await db.select().from(adminUsers).where(eq(adminUsers.email, email)))[0];
  if (!user) {
    dummyHash ??= hashPassword('valfran-dummy-password');
    await verifyPassword(password, await dummyHash);
    return { error: 'Identifiants incorrects.' };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) return { error: 'Compte temporairement verrouillé après plusieurs échecs. Réessayez plus tard.' };
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const attempts = user.failedAttempts + 1;
    await db.update(adminUsers).set({ failedAttempts: attempts, lockedUntil: attempts >= LOCK_AFTER ? new Date(Date.now() + LOCK_MINUTES * 60000) : null }).where(eq(adminUsers.id, user.id));
    await audit(email, 'login_failed', 'admin_user', user.id);
    return { error: 'Identifiants incorrects.' };
  }
  await db.update(adminUsers).set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await createSession(user.id);
  await audit(email, 'login', 'admin_user', user.id);
  redirect('/admin');
}

export async function logoutAction() {
  await destroySession();
  redirect('/admin/connexion');
}

export async function changePasswordAction(_: { error?: string; ok?: boolean }, form: FormData): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireAdmin();
  const current = String(form.get('current') ?? '');
  const next = String(form.get('next') ?? '');
  const problem = passwordProblems(next);
  if (problem) return { error: problem };
  const db = await getDb();
  const user = (await db.select().from(adminUsers).where(eq(adminUsers.id, me.id)))[0];
  if (!user || !(await verifyPassword(current, user.passwordHash))) return { error: 'Mot de passe actuel incorrect.' };
  await db.update(adminUsers).set({ passwordHash: await hashPassword(next) }).where(eq(adminUsers.id, me.id));
  await audit(me.email, 'password_changed', 'admin_user', me.id);
  return { ok: true };
}
