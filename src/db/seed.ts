import { sql, eq } from 'drizzle-orm';
import type { DB } from './client';
import * as s from './schema';
import { defaultSettings } from '@/modules/settings/defaults';
import { SERVICE_SEEDS, COMMUNE_SEEDS, FAQ_SEEDS } from '@/modules/catalog/defaults';
import { newId } from '@/lib/ids';
import { slugify } from '@/lib/text';
import { env } from '@/lib/env';

/** Données de base (paramètres, prestations, communes, FAQ) : créées si absentes, jamais écrasées. */
export async function ensureBaseData(db: DB) {
  const demo = env.demoMode;
  const defaults = defaultSettings(demo);
  for (const [key, value] of Object.entries(defaults)) {
    await db.insert(s.settings).values({ key, value }).onConflictDoNothing();
  }
  const [{ n: serviceCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.services);
  if (serviceCount === 0) {
    await db.insert(s.services).values(SERVICE_SEEDS.map((x, i) => ({
      id: newId(), slug: x.slug, name: x.name, category: x.category, shortDescription: x.shortDescription,
      description: x.description, includes: x.includes, requirements: x.requirements, infoNeeded: x.infoNeeded,
      garageZones: x.garageZones, durationMinutes: x.durationMinutes, laborPriceCents: x.laborPriceCents,
      priceValidated: demo && x.laborPriceCents !== null, priceNote: x.priceNote, partsIncluded: !!x.partsIncluded,
      isDiagnostic: !!x.isDiagnostic, active: true, sortOrder: i, seoTitle: x.seoTitle, seoDescription: x.seoDescription,
    })));
  }
  const [{ n: communeCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.communes);
  if (communeCount === 0) {
    await db.insert(s.communes).values(COMMUNE_SEEDS.map((c) => ({
      id: newId(), slug: slugify(c.name), name: c.name, postcode: c.postcode, department: c.department,
      lat: c.lat, lon: c.lon, status: 'served', featured: !!c.featured,
    })));
  }
  const [{ n: faqCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.faqs);
  if (faqCount === 0) {
    await db.insert(s.faqs).values(FAQ_SEEDS.map((f, i) => ({ id: newId(), question: f.question, answer: f.answer, sortOrder: i })));
  }
  if (demo) {
    const { ensureDemoData } = await import('./demo-data');
    await ensureDemoData(db);
  }
}

export async function settingExists(db: DB, key: string) {
  const r = await db.select().from(s.settings).where(eq(s.settings.key, key));
  return r.length > 0;
}
