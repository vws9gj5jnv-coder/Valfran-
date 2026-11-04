/**
 * Connexion à la base de données.
 * - DATABASE_URL défini  → PostgreSQL (Supabase, Neon, serveur dédié…) via postgres.js
 * - sinon               → PGlite (PostgreSQL embarqué, fichier local) : développement et démonstration.
 * Les migrations SQL (dossier drizzle/) sont appliquées automatiquement au premier accès.
 */
import path from 'node:path';
import fs from 'node:fs';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { env } from '@/lib/env';

export type DB = PostgresJsDatabase<typeof schema>;

type G = typeof globalThis & { __valfranDb?: Promise<DB> };
const g = globalThis as G;

async function connect(): Promise<DB> {
  const migrationsFolder = path.join(process.cwd(), 'drizzle');
  let db: DB;
  if (env.databaseUrl) {
    const { default: postgres } = await import('postgres');
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    const client = postgres(env.databaseUrl, { max: Number(process.env.DB_POOL_MAX ?? 5), prepare: false, onnotice: () => {} });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder });
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    const dir = path.resolve(env.pgliteDir);
    fs.mkdirSync(dir, { recursive: true });
    const client = new PGlite(dir);
    const pdb = drizzle(client, { schema });
    await migrate(pdb, { migrationsFolder });
    db = pdb as unknown as DB;
  }
  const { ensureBaseData } = await import('./seed');
  await ensureBaseData(db);
  return db;
}

export function getDb(): Promise<DB> {
  if (!g.__valfranDb) {
    g.__valfranDb = connect().catch((e) => { g.__valfranDb = undefined; throw e; });
  }
  return g.__valfranDb;
}

export { schema };
