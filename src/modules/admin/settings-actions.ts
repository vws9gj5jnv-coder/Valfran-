'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { services, communes, closures, faqs, testimonials, realisations, messages, attachments } from '@/db/schema';
import { requireAdmin, audit } from '@/modules/auth/session';
import { getSettings, saveSetting, invalidateCache } from '@/modules/settings/repo';
import { zonedToUtc } from '@/modules/availability/windows';
import { getStorage, sniffImageType, extensionFor, MAX_UPLOAD_BYTES } from '@/modules/storage/storage';
import { newId } from '@/lib/ids';
import { slugify } from '@/lib/text';
import type { ActionResult } from '@/components/admin/ActionForm';

const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? '').trim().slice(0, max);
const lines = (f: FormData, k: string) => str(f, k, 5000).split('\n').map((x) => x.trim()).filter(Boolean);
const cents = (f: FormData, k: string) => { const v = str(f, k, 20).replace(',', '.'); return v === '' ? null : Math.round(Number(v) * 100); };
const done = async (actor: string, what: string, msg = 'Enregistré'): Promise<ActionResult> => {
  invalidateCache();
  await audit(actor, what, 'settings');
  revalidatePath('/', 'layout');
  return { ok: true, message: msg };
};
const fail = (e: unknown): ActionResult => ({ error: e instanceof Error && 'issues' in e ? 'Valeur invalide : vérifiez les champs.' : (e as Error).message });

/* --------------------------------------------------------------- Prestations */
export async function saveService(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = str(f, 'id');
  const name = str(f, 'name', 80);
  if (!name) return { error: 'Nom obligatoire.' };
  const price = cents(f, 'laborPrice');
  if (price !== null && (Number.isNaN(price) || price < 0)) return { error: 'Prix invalide.' };
  const values = {
    name, category: str(f, 'category', 40) || 'Mécanique', shortDescription: str(f, 'shortDescription', 200), description: str(f, 'description', 2000),
    includes: lines(f, 'includes'), requirements: lines(f, 'requirements'), infoNeeded: lines(f, 'infoNeeded'),
    garageZones: f.getAll('garageZones').map(String).slice(0, 8),
    durationMinutes: Math.max(15, Math.min(720, Number(str(f, 'durationMinutes')) || 60)),
    laborPriceCents: price, priceValidated: f.get('priceValidated') === 'on' && price !== null, priceNote: str(f, 'priceNote', 300),
    active: f.get('active') === 'on', sortOrder: Number(str(f, 'sortOrder')) || 0, seoTitle: str(f, 'seoTitle', 120), seoDescription: str(f, 'seoDescription', 300),
    isDiagnostic: f.get('isDiagnostic') === 'on', updatedAt: new Date(),
  };
  const db = await getDb();
  if (id) await db.update(services).set(values).where(eq(services.id, id));
  else {
    const slug = slugify(str(f, 'slug') || name);
    if ((await db.select().from(services).where(eq(services.slug, slug))).length) return { error: 'Une prestation porte déjà cette adresse (slug).' };
    await db.insert(services).values({ ...values, id: newId(), slug });
  }
  return done(me.email, 'service_saved');
}

export async function toggleService(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const db = await getDb();
  await db.update(services).set({ active: f.get('active') === 'true', updatedAt: new Date() }).where(eq(services.id, str(f, 'id')));
  return done(me.email, 'service_toggled', f.get('active') === 'true' ? 'Prestation activée' : 'Prestation désactivée');
}

/* --------------------------------------------------------------- Zones */
export async function saveZone(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  try {
    const s = await getSettings();
    const tiers: { upToKm: number; feeCents: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const km = str(f, `tierKm${i}`);
      const fee = cents(f, `tierFee${i}`);
      if (km && fee !== null) tiers.push({ upToKm: Number(km), feeCents: fee });
    }
    await saveSetting('zone', {
      ...s.zone, baseName: str(f, 'baseName', 80), baseLat: Number(str(f, 'baseLat')), baseLon: Number(str(f, 'baseLon')),
      maxKm: Number(str(f, 'maxKm')), roadFactor: Number(str(f, 'roadFactor')), outsidePolicy: str(f, 'outsidePolicy') === 'refuse' ? 'refuse' : 'on_request',
      tiers: tiers.sort((a, b) => a.upToKm - b.upToKm),
    });
    return done(me.email, 'zone_saved');
  } catch (e) { return fail(e); }
}

export async function saveCommune(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = str(f, 'id');
  const db = await getDb();
  const status = ['served', 'on_request', 'excluded'].includes(str(f, 'status')) ? str(f, 'status') : 'served';
  const base = { status, travelFeeOverrideCents: cents(f, 'fee'), featured: f.get('featured') === 'on', localIntro: str(f, 'localIntro', 1500) };
  if (id) await db.update(communes).set(base).where(eq(communes.id, id));
  else {
    const name = str(f, 'name', 80);
    const postcode = str(f, 'postcode', 5);
    const lat = Number(str(f, 'lat')), lon = Number(str(f, 'lon'));
    if (!name || !/^\d{5}$/.test(postcode) || !Number.isFinite(lat) || !Number.isFinite(lon) || !lat || !lon) return { error: 'Nom, code postal et coordonnées (latitude, longitude) obligatoires.' };
    const slug = slugify(name);
    if ((await db.select().from(communes).where(eq(communes.slug, slug))).length) return { error: 'Cette commune existe déjà.' };
    await db.insert(communes).values({ ...base, id: newId(), slug, name, postcode, department: postcode.slice(0, 2), lat, lon });
  }
  return done(me.email, 'commune_saved');
}

export async function deleteCommune(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const db = await getDb();
  await db.delete(communes).where(eq(communes.id, str(f, 'id')));
  return done(me.email, 'commune_deleted', 'Commune supprimée');
}

/* --------------------------------------------------------------- Disponibilités */
export async function saveAvailability(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  try {
    const s = await getSettings();
    const weekly: Record<string, { start: string; end: string }[]> = {};
    for (let d = 1; d <= 7; d++) {
      weekly[String(d)] = [];
      for (const p of ['am', 'pm']) {
        const a = str(f, `d${d}${p}s`), b = str(f, `d${d}${p}e`);
        if (f.get(`d${d}${p}`) === 'on' && a && b) {
          if (a >= b) return { error: 'Une plage horaire se termine avant de commencer.' };
          weekly[String(d)].push({ start: a, end: b });
        }
      }
    }
    await saveSetting('availability', { ...s.availability, weekly, minNoticeHours: Number(str(f, 'minNoticeHours')) || 0, daysAhead: Number(str(f, 'daysAhead')) || 21 });
    return done(me.email, 'availability_saved');
  } catch (e) { return fail(e); }
}

export async function addClosure(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const from = str(f, 'from'), to = str(f, 'to');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to < from) return { error: 'Dates invalides.' };
  const startsAt = zonedToUtc(from, str(f, 'fromTime') || '00:00', 'Europe/Paris');
  const endsAt = zonedToUtc(to, str(f, 'toTime') || '23:59', 'Europe/Paris');
  const db = await getDb();
  await db.insert(closures).values({ id: newId(), startsAt, endsAt, kind: str(f, 'kind') === 'conges' ? 'conges' : 'indisponibilite', reason: str(f, 'reason', 200) });
  return done(me.email, 'closure_added', 'Période ajoutée');
}

export async function deleteClosure(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const db = await getDb();
  await db.delete(closures).where(eq(closures.id, str(f, 'id')));
  return done(me.email, 'closure_deleted', 'Période supprimée');
}

/* --------------------------------------------------------------- Coordonnées et contenus */
export async function saveBusiness(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  try {
    const s = await getSettings();
    const hours = lines(f, 'hours').map((l) => { const [label, ...rest] = l.split(':'); return { label: label.trim(), value: rest.join(':').trim() }; }).filter((h) => h.label && h.value);
    const phone = str(f, 'phone', 30);
    await saveSetting('business', {
      ...s.business, name: str(f, 'name', 80) || 'VALFRAN', tagline: str(f, 'tagline', 120), phone, phoneIsPlaceholder: phone === '03 53 01 00 00',
      email: str(f, 'email', 120), addressLine: str(f, 'addressLine', 200), postcode: str(f, 'postcode', 10), city: str(f, 'city', 80),
      legalName: str(f, 'legalName', 120), legalForm: str(f, 'legalForm', 120), siret: str(f, 'siret', 20), registration: str(f, 'registration', 120),
      vatNumber: str(f, 'vatNumber', 30), publicationDirector: str(f, 'publicationDirector', 120), hostName: str(f, 'hostName', 200), hostAddress: str(f, 'hostAddress', 300),
      insurance: str(f, 'insurance', 300), mediator: str(f, 'mediator', 300), googleBusinessUrl: str(f, 'googleBusinessUrl', 500).startsWith('https://') ? str(f, 'googleBusinessUrl', 500) : '',
      hours: hours.length ? hours : s.business.hours, qualifications: lines(f, 'qualifications').slice(0, 20),
    });
    return done(me.email, 'business_saved');
  } catch (e) { return fail(e); }
}

export async function saveContent(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  try {
    await saveSetting('content', {
      heroTitle: str(f, 'heroTitle', 80), heroSubtitle: str(f, 'heroSubtitle', 240), aboutTitle: str(f, 'aboutTitle', 120),
      aboutText: str(f, 'aboutText', 4000), bookingIntro: str(f, 'bookingIntro', 400), realisationsIntro: str(f, 'realisationsIntro', 600),
    });
    return done(me.email, 'content_saved');
  } catch (e) { return fail(e); }
}

export async function saveFaq(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const db = await getDb();
  const id = str(f, 'id');
  const values = { question: str(f, 'question', 300), answer: str(f, 'answer', 3000), sortOrder: Number(str(f, 'sortOrder')) || 0, active: f.get('active') === 'on' };
  if (!values.question || !values.answer) return { error: 'Question et réponse obligatoires.' };
  if (f.get('delete') === 'on' && id) await db.delete(faqs).where(eq(faqs.id, id));
  else if (id) await db.update(faqs).set(values).where(eq(faqs.id, id));
  else await db.insert(faqs).values({ ...values, id: newId() });
  return done(me.email, 'faq_saved');
}

export async function saveTestimonial(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const db = await getDb();
  const id = str(f, 'id');
  if (f.get('delete') === 'on' && id) { await db.delete(testimonials).where(eq(testimonials.id, id)); return done(me.email, 'testimonial_deleted', 'Avis supprimé'); }
  const values = { author: str(f, 'author', 80), text: str(f, 'text', 1500), source: str(f, 'source', 60), sourceUrl: str(f, 'sourceUrl', 500).startsWith('https://') ? str(f, 'sourceUrl', 500) : '', rating: Number(str(f, 'rating')) || null, published: f.get('published') === 'on' };
  if (!values.author || !values.text || !values.source) return { error: 'Auteur, texte et source de l’avis obligatoires.' };
  if (f.get('authentic') !== 'on') return { error: 'Confirmez que cet avis est authentique (publié par un vrai client).' };
  if (id) await db.update(testimonials).set(values).where(eq(testimonials.id, id));
  else await db.insert(testimonials).values({ ...values, id: newId() });
  return done(me.email, 'testimonial_saved');
}

export async function saveRealisation(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const db = await getDb();
  const id = str(f, 'id') || newId();
  const exists = (await db.select().from(realisations).where(eq(realisations.id, id))).length > 0;
  if (f.get('delete') === 'on' && exists) {
    const ph = await db.select().from(attachments).where(eq(attachments.realisationId, id));
    for (const p of ph) await getStorage().remove(p.storageKey).catch(() => {});
    await db.delete(attachments).where(eq(attachments.realisationId, id));
    await db.delete(realisations).where(eq(realisations.id, id));
    return done(me.email, 'realisation_deleted', 'Réalisation supprimée');
  }
  const values = { title: str(f, 'title', 160), description: str(f, 'description', 2000), serviceSlug: str(f, 'serviceSlug') || null, commune: str(f, 'commune', 80), date: str(f, 'date') ? new Date(str(f, 'date')) : null, published: f.get('published') === 'on' };
  if (!values.title) return { error: 'Titre obligatoire.' };
  if (exists) await db.update(realisations).set(values).where(eq(realisations.id, id));
  else await db.insert(realisations).values({ ...values, id });
  const file = f.get('photo');
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) return { error: 'Photo trop lourde (8 Mo maximum).' };
    const buf = new Uint8Array(await file.arrayBuffer());
    const mime = sniffImageType(buf);
    if (!mime || mime === 'image/heic') return { error: 'Format accepté : JPEG, PNG ou WebP.' };
    const aid = newId();
    const key = `realisations/${aid}.${extensionFor(mime)}`;
    await getStorage().put(key, buf, mime);
    await db.insert(attachments).values({ id: aid, realisationId: id, storageKey: key, mime, size: buf.length, originalName: file.name.slice(0, 80), isPublic: true });
  }
  return done(me.email, 'realisation_saved');
}

/* --------------------------------------------------------------- Paramètres */
export async function savePricing(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  try {
    const s = await getSettings();
    await saveSetting('pricing', { ...s.pricing, hourlyRateCents: cents(f, 'hourlyRate') ?? 0, vatMode: str(f, 'vatMode') === 'normal' ? 'normal' : 'franchise', vatRate: Number(str(f, 'vatRate')) || 20, demoPrices: f.get('demoPrices') === 'on', quoteValidityDays: Number(str(f, 'quoteValidityDays')) || 30, estimateDisclaimer: str(f, 'estimateDisclaimer', 400) });
    return done(me.email, 'pricing_saved');
  } catch (e) { return fail(e); }
}

export async function saveNotifications(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  try {
    await saveSetting('notifications', { notifyAdminByEmail: f.get('notifyAdminByEmail') === 'on', customerEmail: f.get('customerEmail') === 'on', customerSms: f.get('customerSms') === 'on' });
    const s = await getSettings();
    await saveSetting('retention', { ...s.retention, prospectMonths: Number(str(f, 'prospectMonths')) || 36, customerMonths: Number(str(f, 'customerMonths')) || 60 });
    return done(me.email, 'notifications_saved');
  } catch (e) { return fail(e); }
}

export async function markMessage(_: ActionResult, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const db = await getDb();
  await db.update(messages).set({ status: f.get('status') === 'nouveau' ? 'nouveau' : 'traite' }).where(eq(messages.id, str(f, 'id')));
  await audit(me.email, 'message_marked', 'message', str(f, 'id'));
  revalidatePath('/admin/messages');
  return { ok: true };
}
