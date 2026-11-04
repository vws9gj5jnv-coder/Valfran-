'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { customers, vehicles, bookings, attachments } from '@/db/schema';
import { requireAdmin, audit } from '@/modules/auth/session';
import { getStorage } from '@/modules/storage/storage';
import { normalizeFrenchPhone } from '@/lib/text';
import type { ActionResult } from '@/components/admin/ActionForm';

export async function saveCustomer(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = String(form.get('id'));
  const name = String(form.get('name') ?? '').trim().slice(0, 100);
  const phoneRaw = String(form.get('phone') ?? '');
  const phone = normalizeFrenchPhone(phoneRaw);
  if (name.length < 2) return { error: 'Nom obligatoire.' };
  if (!phone) return { error: 'Téléphone invalide.' };
  const email = String(form.get('email') ?? '').trim().slice(0, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'E-mail invalide.' };
  const db = await getDb();
  await db.update(customers).set({
    name, phone, email: email || null, address: String(form.get('address') ?? '').slice(0, 200), postcode: String(form.get('postcode') ?? '').slice(0, 10),
    city: String(form.get('city') ?? '').slice(0, 80), notes: String(form.get('notes') ?? '').slice(0, 5000), updatedAt: new Date(),
  }).where(eq(customers.id, id));
  await audit(me.email, 'customer_updated', 'customer', id);
  revalidatePath(`/admin/clients/${id}`);
  return { ok: true };
}

/**
 * Droit à l'effacement : anonymise la fiche (les devis acceptés restent pour les obligations comptables, sans données
 * d'identification superflues), supprime les photos et les plaques.
 */
export async function anonymizeCustomer(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = String(form.get('id'));
  const db = await getDb();
  const bs = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.customerId, id));
  for (const b of bs) {
    const files = await db.select().from(attachments).where(eq(attachments.bookingId, b.id));
    for (const f of files) await getStorage().remove(f.storageKey).catch(() => {});
    await db.delete(attachments).where(eq(attachments.bookingId, b.id));
    await db.update(bookings).set({ address: '[anonymisé]', description: '', internalNotes: '', availabilityNote: '', lat: null, lon: null }).where(eq(bookings.id, b.id));
  }
  await db.update(vehicles).set({ plate: null, vin: null }).where(eq(vehicles.customerId, id));
  await db.update(customers).set({ name: 'Client anonymisé', phone: '0000000000', email: null, address: '', notes: '', anonymizedAt: new Date(), updatedAt: new Date() }).where(eq(customers.id, id));
  await audit(me.email, 'customer_anonymized', 'customer', id);
  revalidatePath('/admin', 'layout');
  return { ok: true, message: 'Fiche anonymisée' };
}
