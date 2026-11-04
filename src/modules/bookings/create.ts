import { and, eq, inArray, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { bookings, bookingEvents, customers, vehicles, attachments } from '@/db/schema';
import { bookingInputSchema, type BookingData } from './input';
import { listServices, getSettings } from '@/modules/settings/repo';
import { checkAddress } from '@/modules/zones/check';
import { buildEstimate } from '@/modules/pricing/estimate';
import { getAvailableWindows } from '@/modules/availability/service';
import { categorize, vehicleLabel } from '@/modules/vehicles/catalog';
import { normalizePlate } from '@/modules/plates/plate';
import { notify } from '@/modules/notifications/notify';
import { bookingReference, newId, newToken } from '@/lib/ids';
import { formatPhone, normalizeFrenchPhone, euros } from '@/lib/text';
import { env } from '@/lib/env';

export type CreateBookingResult =
  | { ok: true; reference: string; token: string; duplicate?: boolean }
  | { ok: false; error: 'validation'; fieldErrors: Record<string, string> }
  | { ok: false; error: 'outside_zone' | 'slots_unavailable' | 'unknown_service'; message: string };

const fmtSlot = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export async function createBooking(raw: unknown): Promise<CreateBookingResult> {
  const parsed = bookingInputSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join('.') || 'form'] ??= issue.message;
    return { ok: false, error: 'validation', fieldErrors };
  }
  const input: BookingData = parsed.data;
  const phone = normalizeFrenchPhone(input.contact.phone);
  if (!phone) return { ok: false, error: 'validation', fieldErrors: { 'contact.phone': 'Numéro de téléphone français invalide (ex. 06 12 34 56 78).' } };

  const db = await getDb();
  const existing = await db.select({ reference: bookings.reference, token: bookings.publicToken }).from(bookings).where(eq(bookings.idempotencyKey, input.idempotencyKey));
  if (existing[0]) return { ok: true, reference: existing[0].reference, token: existing[0].token, duplicate: true };

  const settings = await getSettings();
  const allServices = await listServices();
  const selected = allServices.filter((s) => input.services.includes(s.slug));
  if (selected.length !== input.services.length) return { ok: false, error: 'unknown_service', message: 'Une prestation choisie n’est plus proposée. Merci de revoir votre sélection.' };
  const diagnostic = allServices.find((s) => s.isDiagnostic) ?? null;

  const zone = await checkAddress(input.address);
  if (zone.status === 'outside' || (zone.status === 'unknown' && settings.zone.outsidePolicy === 'refuse')) {
    return { ok: false, error: 'outside_zone', message: zone.message };
  }

  // Les préférences de créneaux doivent toujours être disponibles au moment de l'envoi.
  const duration = Math.max(60, selected.reduce((a, s) => a + s.durationMinutes, 0) || (diagnostic?.durationMinutes ?? 60));
  if (input.preferredSlots.length > 0) {
    const windows = await getAvailableWindows(duration);
    const ok = new Set(windows.filter((w) => w.available).map((w) => w.startIso));
    if (input.preferredSlots.some((s) => !ok.has(new Date(s).toISOString()))) {
      return { ok: false, error: 'slots_unavailable', message: 'Un des créneaux choisis vient d’être pris. Merci d’en choisir un autre.' };
    }
  }

  const estimate = buildEstimate({
    services: selected,
    unknownIssue: input.unknownIssue,
    diagnosticService: diagnostic,
    travelFeeCents: zone.feeCents,
    zoneStatus: zone.status === 'unknown' ? 'on_request' : zone.status,
    demoPrices: settings.pricing.demoPrices,
    disclaimer: settings.pricing.estimateDisclaimer,
  });

  const plate = input.vehicle.source === 'plate' && input.vehicle.plate ? normalizePlate(input.vehicle.plate) : null;
  const serviceSlugs = input.unknownIssue && diagnostic && !input.services.includes(diagnostic.slug) ? [diagnostic.slug, ...input.services] : input.services;

  const result = await db.transaction(async (tx) => {
    const found = await tx.select().from(customers).where(and(eq(customers.phone, phone), isNull(customers.anonymizedAt)));
    let customerId: string;
    if (found[0]) {
      customerId = found[0].id;
      await tx.update(customers).set({
        name: input.contact.name, email: input.contact.email || found[0].email, address: input.address.street,
        postcode: input.address.postcode, city: input.address.city, updatedAt: new Date(),
      }).where(eq(customers.id, customerId));
    } else {
      customerId = newId();
      await tx.insert(customers).values({ id: customerId, name: input.contact.name, phone, email: input.contact.email || null, address: input.address.street, postcode: input.address.postcode, city: input.address.city });
    }
    const vehicleId = newId();
    await tx.insert(vehicles).values({
      id: vehicleId, customerId, plate: plate?.ok ? plate.normalized : null, vin: input.vehicle.vin || null,
      make: input.vehicle.make, model: input.vehicle.model, year: input.vehicle.year ?? null, engine: input.vehicle.engine,
      fuel: input.vehicle.fuel, category: categorize(input.vehicle.make, input.vehicle.model), source: input.vehicle.source,
      lookupProvider: input.vehicle.source === 'plate' ? env.plateProvider : null,
    });
    const id = newId();
    const token = newToken(24);
    let reference = bookingReference();
    for (let i = 0; i < 5; i++) {
      const clash = await tx.select({ id: bookings.id }).from(bookings).where(eq(bookings.reference, reference));
      if (!clash[0]) break;
      reference = bookingReference();
    }
    await tx.insert(bookings).values({
      id, reference, publicToken: token, status: 'nouvelle', customerId, vehicleId, serviceSlugs,
      unknownIssue: input.unknownIssue, description: input.description, address: input.address.street,
      postcode: input.address.postcode, city: input.address.city, lat: zone.lat, lon: zone.lon,
      distanceKm: zone.distanceKm, zoneStatus: zone.status, travelFeeCents: zone.feeCents, estimate,
      preferredSlots: input.preferredSlots.map((s) => new Date(s).toISOString()), availabilityNote: input.availabilityNote,
      travelMinutes: zone.travelMinutes, contactPreference: input.contact.preference, idempotencyKey: input.idempotencyKey,
    });
    await tx.insert(bookingEvents).values({ bookingId: id, type: 'created', toStatus: 'nouvelle', note: 'Demande envoyée depuis le site', actor: 'client' });
    if (input.attachmentIds.length) {
      await tx.update(attachments).set({ bookingId: id }).where(and(inArray(attachments.id, input.attachmentIds), isNull(attachments.bookingId)));
    }
    return { id, reference, token };
  });

  // Notifications (simulées en mode démonstration, journalisées dans tous les cas).
  const vLabel = vehicleLabel(input.vehicle);
  const names = serviceSlugs.map((s) => allServices.find((x) => x.slug === s)?.name ?? s).join(', ');
  const slots = input.preferredSlots.map(fmtSlot).join(' ; ') || 'À convenir';
  const recap = [
    `Référence : ${result.reference}`,
    `Véhicule : ${vLabel}${plate?.ok ? ` (${plate.normalized})` : ''}`,
    `Intervention : ${names}${input.unknownIssue ? ' (panne à identifier)' : ''}`,
    `Adresse : ${input.address.street}, ${input.address.postcode} ${input.address.city}`,
    `Préférences : ${slots}`,
    estimate.knownTotalCents !== null ? `Estimation indicative : ${euros(estimate.knownTotalCents)} (hors pièces)` : 'Tarif : devis personnalisé après vérification',
  ].join('\n');
  const biz = settings.business;
  if (settings.notifications.notifyAdminByEmail && (env.adminNotifyEmail || biz.email)) {
    await notify({ channel: 'email', to: env.adminNotifyEmail || biz.email, subject: `Nouvelle demande ${result.reference} — ${names}`, body: `${recap}\n\nClient : ${input.contact.name} — ${formatPhone(phone)}${input.contact.email ? ` — ${input.contact.email}` : ''}\nDescription : ${input.description || '—'}`, bookingId: result.id, replyTo: input.contact.email || undefined });
  }
  if (settings.notifications.customerEmail && input.contact.email) {
    await notify({ channel: 'email', to: input.contact.email, subject: `${biz.name} — demande ${result.reference} bien reçue`, body: `Bonjour ${input.contact.name},\n\nNous avons bien reçu votre demande de rendez-vous. Elle n’est pas encore confirmée : nous vous contactons rapidement pour convenir de la date et du montant.\n\n${recap}\n\n${biz.name} — ${biz.phone}`, bookingId: result.id });
  }
  if (settings.notifications.customerSms && input.contact.preference === 'sms') {
    await notify({ channel: 'sms', to: phone, body: `${biz.name} : demande ${result.reference} reçue. Nous vous recontactons pour confirmer le rendez-vous.`, bookingId: result.id });
  }
  return { ok: true, reference: result.reference, token: result.token };
}
