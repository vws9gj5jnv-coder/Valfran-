/** Applique les migrations et crée les données de base (et de démonstration si DEMO_MODE). */
import { getDb } from '../src/db/client';

const db = await getDb();
console.log('Base de données prête.', process.env.DATABASE_URL ? '(PostgreSQL)' : '(PGlite local)');
void db;
process.exit(0);
