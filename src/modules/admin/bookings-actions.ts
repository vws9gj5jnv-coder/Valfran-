'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { bookings, bookingEvents, customers } from '@/db/schema';
import { requireAdmin, audit } from '@/modules/auth/session';
import { BOOKING_STATUSES, canTransition, isBookingStatus } from '@/modules/bookings/status';
import { zonedToUtc } from '@/modules/availability/windows';
import { notify } from '@/modules/notifications/notify';
import { getSettings } from '@/modules/settings/repo';
import type { ActionResult } from '@/components/admin/ActionForm';

const fmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

async function load(id: string) {
  const db = await getDb();
  const b = (await db.select().from(bookings).where(eq(bookings.id, id)))[0];
  if (!b) throw new Error('Demande introuvable.');
  return { db, b };
}

/** Changement de statut (avec contrôle des transitions autorisées). */
export async function setBookingStatus(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = String(form.get('id'));
  const to = String(form.get('status'));
  const note = String(form.get('note') ?? '').slice(0, 1000);
  if (!isBookingStatus(to)) return { error: 'Statut inconnu.' };
  const { db, b } = await load(id);
  if (b.status === to) return { ok: true, message: 'Inchangé' };
  if (!isBookingStatus(b.status) || !canTransition(b.status, to)) return { error: `Passage de « ${BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]} » à « ${BOOKING_STATUSES[to]} » impossible.` };
  if (to === 'confirmee' && !b.scheduledStart) return { error: 'Planifiez d’abord la date et l’heure de l’intervention.' };
  await db.update(bookings).set({ status: to, updatedAt: new Date(), cancelReason: to === 'annulee' ? note : b.cancelReason }).where(eq(bookings.id, id));
  await db.insert(bookingEvents).values({ bookingId: id, type: 'status', fromStatus: b.status, toStatus: to, note, actor: me.email });
  await audit(me.email, `booking_status_${to}`, 'booking', id);
  if (form.get('notify') === 'on') await notifyCustomer(b.id, to);
  revalidatePath('/admin', 'layout');
  return { ok: true, message: `Statut : ${BOOKING_STATUSES[to]}` };
}

/** Planification (date, heure, durée, temps de trajet). Une demande planifiée peut ensuite être confirmée. */
export async function scheduleBooking(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = String(form.get('id'));
  const date = String(form.get('date') ?? '');
  const time = String(form.get('time') ?? '');
  const duration = Math.max(15, Math.min(720, Number(form.get('duration') ?? 60)));
  const travel = Math.max(0, Math.min(300, Number(form.get('travel') ?? 0)));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { error: 'Date ou heure invalide.' };
  const { db, b } = await load(id);
  const start = zonedToUtc(date, time, 'Europe/Paris');
  const end = new Date(start.getTime() + duration * 60000);
  const confirm = form.get('confirm') === 'on';
  const newStatus = confirm && isBookingStatus(b.status) && canTransition(b.status, 'confirmee') ? 'confirmee' : b.status;
  await db.update(bookings).set({ scheduledStart: start, scheduledEnd: end, travelMinutes: travel, status: newStatus, updatedAt: new Date() }).where(eq(bookings.id, id));
  await db.insert(bookingEvents).values({ bookingId: id, type: b.scheduledStart ? 'rescheduled' : 'scheduled', fromStatus: b.status, toStatus: newStatus, note: fmt.format(start), actor: me.email });
  if (newStatus === 'confirmee' && form.get('notify') === 'on') await notifyCustomer(id, 'confirmee', start);
  await audit(me.email, 'booking_schedule', 'booking', id);
  revalidatePath('/admin', 'layout');
  return { ok: true, message: newStatus === 'confirmee' ? 'Rendez-vous planifié et confirmé' : 'Créneau enregistré' };
}

export async function saveBookingNotes(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = String(form.get('id'));
  const { db } = await load(id);
  await db.update(bookings).set({ internalNotes: String(form.get('internalNotes') ?? '').slice(0, 5000), description: String(form.get('description') ?? '').slice(0, 2000), updatedAt: new Date() }).where(eq(bookings.id, id));
  await audit(me.email, 'booking_notes', 'booking', id);
  revalidatePath(`/admin/demandes/${id}`);
  return { ok: true };
}

export async function deleteBooking(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = String(form.get('id'));
  const { db } = await load(id);
  await db.delete(bookings).where(eq(bookings.id, id));
  await audit(me.email, 'booking_deleted', 'booking', id);
  revalidatePath('/admin', 'layout');
  redirect('/admin/demandes');
}

async function notifyCustomer(bookingId: string, status: string, start?: Date) {
  const db = await getDb();
  const b = (await db.select().from(bookings).where(eq(bookings.id, bookingId)))[0];
  if (!b) return;
  const c = (await db.select().from(customers).where(eq(customers.id, b.customerId)))[0];
  const s = await getSettings();
  const when = start ?? b.scheduledStart;
  const text =
    status === 'confirmee' && when ? `${s.business.name} : votre rendez-vous ${b.reference} est confirmé le ${fmt.format(when)}, ${b.address}, ${b.city}. Contact : ${s.business.phone}`
      : status === 'annulee' ? `${s.business.name} : votre demande ${b.reference} est annulée. Pour toute question : ${s.business.phone}`
        : `${s.business.name} : votre demande ${b.reference} a été mise à jour (${BOOKING_STATUSES[status as keyof typeof BOOKING_STATUSES]}).`;
  if (c?.email && s.notifications.customerEmail) await notify({ channel: 'email', to: c.email, subject: `${s.business.name} — demande ${b.reference}`, body: text, bookingId });
  if (c?.phone && s.notifications.customerSms && (b.contactPreference === 'sms' || !c.email)) await notify({ channel: 'sms', to: c.phone, body: text, bookingId });
}
