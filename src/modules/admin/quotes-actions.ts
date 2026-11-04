'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { bookings, customers, quotes, quoteLines, vehicles } from '@/db/schema';
import { requireAdmin, audit } from '@/modules/auth/session';
import { nextQuoteNumber, recomputeQuote, quoteEvent } from '@/modules/quotes/service';
import { LINE_KINDS, QUOTE_STATUSES } from '@/modules/quotes/totals';
import { getSettings, listServices } from '@/modules/settings/repo';
import { vehicleLabel } from '@/modules/vehicles/catalog';
import { notify } from '@/modules/notifications/notify';
import { newId, newToken } from '@/lib/ids';
import { euros } from '@/lib/text';
import { env } from '@/lib/env';
import type { ActionResult } from '@/components/admin/ActionForm';

/** Crée un devis pré-rempli depuis une demande : main-d'œuvre selon tarifs, déplacement. Les pièces restent à saisir. */
export async function createQuoteFromBooking(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const bookingId = String(form.get('bookingId'));
  const db = await getDb();
  const b = (await db.select().from(bookings).where(eq(bookings.id, bookingId)))[0];
  if (!b) return { error: 'Demande introuvable.' };
  const v = b.vehicleId ? (await db.select().from(vehicles).where(eq(vehicles.id, b.vehicleId)))[0] : null;
  const s = await getSettings();
  const services = (await listServices({ includeInactive: true })).filter((x) => b.serviceSlugs.includes(x.slug));
  const id = newId();
  const vat = s.pricing.vatMode === 'normal' ? s.pricing.vatRate : 0;
  const toHt = (ttc: number) => (s.pricing.vatMode === 'normal' ? Math.round(ttc / (1 + s.pricing.vatRate / 100)) : ttc);
  await db.insert(quotes).values({
    id, number: await nextQuoteNumber(db), publicToken: newToken(), customerId: b.customerId, bookingId: b.id, vehicleLabel: v ? vehicleLabel(v) : '',
    title: services.map((x) => x.name).join(', ') || 'Intervention', vatMode: s.pricing.vatMode, validUntil: new Date(Date.now() + s.pricing.quoteValidityDays * 86400_000), isDemo: b.isDemo,
  });
  const lines = [
    ...services.map((x) => ({ kind: 'main_oeuvre', label: `Main-d’œuvre — ${x.name}`, quantity: x.laborPriceCents !== null ? 1 : Math.round((x.durationMinutes / 60) * 4) / 4, unit: x.laborPriceCents !== null ? toHt(x.laborPriceCents) : toHt(s.pricing.hourlyRateCents) })),
    ...(b.travelFeeCents ? [{ kind: 'deplacement', label: `Déplacement — ${b.city}`, quantity: 1, unit: toHt(b.travelFeeCents) }] : []),
  ];
  if (lines.length) await db.insert(quoteLines).values(lines.map((l, i) => ({ id: newId(), quoteId: id, kind: l.kind, label: l.label, quantity: String(l.quantity), unitPriceHtCents: l.unit, vatRate: String(vat || 20), sortOrder: i })));
  await recomputeQuote(db, id);
  await quoteEvent(id, 'created', me.email, `Depuis la demande ${b.reference}`);
  if (b.status === 'nouvelle' || b.status === 'a_etudier') await db.update(bookings).set({ status: 'devis_necessaire', updatedAt: new Date() }).where(eq(bookings.id, b.id));
  await audit(me.email, 'quote_created', 'quote', id);
  redirect(`/admin/devis/${id}`);
}

export async function createQuoteForCustomer(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const customerId = String(form.get('customerId'));
  const db = await getDb();
  const c = (await db.select().from(customers).where(eq(customers.id, customerId)))[0];
  if (!c) return { error: 'Client introuvable.' };
  const s = await getSettings();
  const id = newId();
  await db.insert(quotes).values({ id, number: await nextQuoteNumber(db), publicToken: newToken(), customerId, title: 'Intervention', vatMode: s.pricing.vatMode, validUntil: new Date(Date.now() + s.pricing.quoteValidityDays * 86400_000), isDemo: c.isDemo });
  await quoteEvent(id, 'created', me.email);
  redirect(`/admin/devis/${id}`);
}

const lineSchema = z.object({
  kind: z.enum(Object.keys(LINE_KINDS) as [string, ...string[]]),
  label: z.string().trim().min(1).max(300),
  reference: z.string().trim().max(80).default(''),
  quantity: z.number().min(0).max(10000),
  unitPriceHtCents: z.number().int().min(-10_000_000).max(10_000_000),
  vatRate: z.number().min(0).max(30),
});
const saveSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(200),
  vehicleLabel: z.string().trim().max(200),
  notes: z.string().max(4000),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')),
  vatMode: z.enum(['franchise', 'normal']),
  lines: z.array(lineSchema).max(60),
});

export async function saveQuote(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  let raw: unknown;
  try { raw = JSON.parse(String(form.get('payload') ?? '{}')); } catch { return { error: 'Données invalides.' }; }
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return { error: 'Vérifiez les lignes : libellé obligatoire, montants valides.' };
  const d = parsed.data;
  const db = await getDb();
  const q = (await db.select().from(quotes).where(eq(quotes.id, d.id)))[0];
  if (!q) return { error: 'Devis introuvable.' };
  if (q.status === 'accepte') return { error: 'Un devis accepté ne peut plus être modifié. Dupliquez-le pour établir un nouveau devis.' };
  await db.transaction(async (tx) => {
    await tx.update(quotes).set({ title: d.title, vehicleLabel: d.vehicleLabel, notes: d.notes, vatMode: d.vatMode, validUntil: d.validUntil ? new Date(`${d.validUntil}T23:59:59`) : null, updatedAt: new Date() }).where(eq(quotes.id, d.id));
    await tx.delete(quoteLines).where(eq(quoteLines.quoteId, d.id));
    if (d.lines.length) await tx.insert(quoteLines).values(d.lines.map((l, i) => ({ id: newId(), quoteId: d.id, kind: l.kind, label: l.label, reference: l.reference, quantity: String(l.quantity), unitPriceHtCents: l.unitPriceHtCents, vatRate: String(l.vatRate), sortOrder: i })));
  });
  const t = await recomputeQuote(db, d.id);
  await quoteEvent(d.id, 'updated', me.email, `Total ${euros(t.totalTtcCents, { decimals: true })}`);
  revalidatePath(`/admin/devis/${d.id}`);
  return { ok: true, message: `Devis enregistré — total ${euros(t.totalTtcCents, { decimals: true })}` };
}

export async function sendQuote(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = String(form.get('id'));
  const db = await getDb();
  const q = (await db.select().from(quotes).where(eq(quotes.id, id)))[0];
  if (!q) return { error: 'Devis introuvable.' };
  if (q.totalTtcCents <= 0) return { error: 'Le devis est vide.' };
  const c = (await db.select().from(customers).where(eq(customers.id, q.customerId)))[0];
  const s = await getSettings();
  const link = `${env.siteUrl}/devis/${q.publicToken}`;
  const body = `Bonjour ${c.name},\n\nVoici votre devis ${q.number} (${q.title}) d’un montant de ${euros(q.totalTtcCents, { decimals: true })}.\nConsultez-le et acceptez-le en ligne : ${link}\n\n${s.business.name} — ${s.business.phone}`;
  let channel = 'lien à transmettre';
  if (c.email) { const r = await notify({ channel: 'email', to: c.email, subject: `${s.business.name} — devis ${q.number}`, body, quoteId: id }); channel = `e-mail (${r.status === 'simulated' ? 'simulé' : r.status})`; }
  else if (c.phone) { const r = await notify({ channel: 'sms', to: c.phone, body: `${s.business.name} : votre devis ${q.number} (${euros(q.totalTtcCents, { decimals: true })}) : ${link}`, quoteId: id }); channel = `SMS (${r.status === 'simulated' ? 'simulé' : r.status})`; }
  await db.update(quotes).set({ status: q.status === 'brouillon' ? 'envoye' : q.status, sentAt: new Date(), updatedAt: new Date() }).where(eq(quotes.id, id));
  await quoteEvent(id, 'sent', me.email, channel);
  await audit(me.email, 'quote_sent', 'quote', id);
  revalidatePath(`/admin/devis/${id}`);
  return { ok: true, message: `Devis marqué envoyé — ${channel}` };
}

export async function setQuoteStatus(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = String(form.get('id'));
  const status = String(form.get('status'));
  if (!(status in QUOTE_STATUSES)) return { error: 'Statut inconnu.' };
  const db = await getDb();
  const set: Partial<typeof quotes.$inferInsert> = { status, updatedAt: new Date() };
  if (status === 'accepte') { set.acceptedAt = new Date(); set.acceptedByName = `Accord enregistré par ${me.email}`; }
  if (status === 'refuse') set.refusedAt = new Date();
  await db.update(quotes).set(set).where(eq(quotes.id, id));
  await quoteEvent(id, `status_${status}`, me.email, String(form.get('note') ?? '').slice(0, 300));
  revalidatePath(`/admin/devis/${id}`);
  return { ok: true, message: `Statut : ${QUOTE_STATUSES[status as keyof typeof QUOTE_STATUSES]}` };
}

export async function duplicateQuote(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = String(form.get('id'));
  const db = await getDb();
  const q = (await db.select().from(quotes).where(eq(quotes.id, id)))[0];
  if (!q) return { error: 'Devis introuvable.' };
  const lines = await db.select().from(quoteLines).where(eq(quoteLines.quoteId, id));
  const nid = newId();
  const s = await getSettings();
  await db.insert(quotes).values({ ...q, id: nid, number: await nextQuoteNumber(db), publicToken: newToken(), status: 'brouillon', sentAt: null, acceptedAt: null, acceptedByName: null, acceptedIpHash: null, acceptedUserAgent: null, refusedAt: null, validUntil: new Date(Date.now() + s.pricing.quoteValidityDays * 86400_000), createdAt: new Date(), updatedAt: new Date() });
  if (lines.length) await db.insert(quoteLines).values(lines.map((l) => ({ ...l, id: newId(), quoteId: nid })));
  await quoteEvent(nid, 'created', me.email, `Copie de ${q.number}`);
  redirect(`/admin/devis/${nid}`);
}

export async function deleteQuote(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = String(form.get('id'));
  const db = await getDb();
  const q = (await db.select().from(quotes).where(eq(quotes.id, id)))[0];
  if (!q) return { error: 'Devis introuvable.' };
  if (q.status !== 'brouillon') return { error: 'Seul un brouillon peut être supprimé (traçabilité des devis envoyés).' };
  await db.delete(quotes).where(eq(quotes.id, id));
  await audit(me.email, 'quote_deleted', 'quote', id);
  redirect('/admin/devis');
}
