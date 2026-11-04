import { asc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { settings, services, communes, faqs, testimonials, realisations } from '@/db/schema';
import { settingsSchemas, type Settings, type SettingsKey } from './schema';
import { defaultSettings } from './defaults';
import { env } from '@/lib/env';

/**
 * Petit cache mémoire (30 s) pour les lectures publiques fréquentes. Invalidé à chaque modification
 * depuis l'administration (même processus). En hébergement multi-instances, le délai maximal de
 * propagation est de 30 s.
 */
const TTL = 30_000;
type Entry = { at: number; value: unknown };
const g = globalThis as typeof globalThis & { __vfCache?: Map<string, Entry> };
const store = (g.__vfCache ??= new Map());

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const value = await load();
  store.set(key, { at: Date.now(), value });
  return value;
}

export const invalidateCache = () => store.clear();

export async function getSettings(): Promise<Settings> {
  return cached('settings', async () => {
    const db = await getDb();
    const rows = await db.select().from(settings);
    const defaults = defaultSettings(env.demoMode);
    const out = { ...defaults } as Record<string, unknown>;
    for (const row of rows) {
      const key = row.key as SettingsKey;
      const schema = settingsSchemas[key];
      if (!schema) continue;
      const parsed = schema.safeParse({ ...(defaults[key] as object), ...(row.value as object) });
      if (parsed.success) out[key] = parsed.data;
    }
    return out as Settings;
  });
}

export async function getSetting<K extends SettingsKey>(key: K): Promise<Settings[K]> {
  return (await getSettings())[key];
}

export async function saveSetting<K extends SettingsKey>(key: K, value: Settings[K]) {
  const parsed = settingsSchemas[key].parse(value);
  const db = await getDb();
  await db.insert(settings).values({ key, value: parsed }).onConflictDoUpdate({ target: settings.key, set: { value: parsed, updatedAt: new Date() } });
  invalidateCache();
}

export type Service = typeof services.$inferSelect;
export type Commune = typeof communes.$inferSelect;

export async function listServices(opts: { includeInactive?: boolean } = {}): Promise<Service[]> {
  const all = await cached('services', async () => {
    const db = await getDb();
    return db.select().from(services).orderBy(asc(services.sortOrder), asc(services.name));
  });
  return opts.includeInactive ? all : all.filter((s) => s.active);
}

export async function getServiceBySlug(slug: string) {
  return (await listServices()).find((s) => s.slug === slug) ?? null;
}

export async function getServicesBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  const db = await getDb();
  return db.select().from(services).where(inArray(services.slug, slugs));
}

export async function listCommunes(): Promise<Commune[]> {
  return cached('communes', async () => {
    const db = await getDb();
    return db.select().from(communes).orderBy(asc(communes.name));
  });
}

export async function getCommuneBySlug(slug: string) {
  return (await listCommunes()).find((c) => c.slug === slug) ?? null;
}

export async function findCommune(postcode: string, city: string) {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, '');
  const list = await listCommunes();
  return list.find((c) => c.postcode === postcode && norm(c.name) === norm(city)) ?? null;
}

export async function listFaqs() {
  return cached('faqs', async () => {
    const db = await getDb();
    return db.select().from(faqs).where(eq(faqs.active, true)).orderBy(asc(faqs.sortOrder));
  });
}

export async function listPublishedTestimonials() {
  return cached('testimonials', async () => {
    const db = await getDb();
    return db.select().from(testimonials).where(eq(testimonials.published, true));
  });
}

export async function listPublishedRealisations() {
  return cached('realisations', async () => {
    const db = await getDb();
    return db.select().from(realisations).where(eq(realisations.published, true));
  });
}
