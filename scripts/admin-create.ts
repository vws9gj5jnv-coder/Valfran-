/**
 * Crée ou met à jour un compte administrateur.
 * Usage : ADMIN_EMAIL=vous@domaine.fr ADMIN_PASSWORD='…' npm run admin:create
 */
import { getDb } from '../src/db/client';
import { adminUsers } from '../src/db/schema';
import { hashPassword, passwordProblems } from '../src/modules/auth/password';
import { newId } from '../src/lib/ids';

const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? '';
if (!email || !email.includes('@')) { console.error('ADMIN_EMAIL manquant ou invalide.'); process.exit(1); }
const problem = passwordProblems(password);
if (problem) { console.error(problem); process.exit(1); }
const db = await getDb();
const hash = await hashPassword(password);
await db.insert(adminUsers).values({ id: newId(), email, name: process.env.ADMIN_NAME ?? '', passwordHash: hash })
  .onConflictDoUpdate({ target: adminUsers.email, set: { passwordHash: hash, failedAttempts: 0, lockedUntil: null } });
console.log(`Compte administrateur prêt : ${email}`);
process.exit(0);
