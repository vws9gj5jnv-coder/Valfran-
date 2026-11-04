import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { Phone, Mail, MapPin, Navigation } from 'lucide-react';
import { getDb } from '@/db/client';
import { bookings, bookingEvents, customers, vehicles, attachments, quotes } from '@/db/schema';
import { AdminHeader, Panel, BookingBadge, QuoteBadge, DemoTag, dt } from '@/components/admin/ui';
import { ActionForm } from '@/components/admin/ActionForm';
import { setBookingStatus, scheduleBooking, saveBookingNotes, deleteBooking } from '@/modules/admin/bookings-actions';
import { createQuoteFromBooking } from '@/modules/admin/quotes-actions';
import { BOOKING_STATUSES, canTransition, type BookingStatus } from '@/modules/bookings/status';
import { listServices } from '@/modules/settings/repo';
import { vehicleLabel, CATEGORY_LABELS, type VehicleCategory } from '@/modules/vehicles/catalog';
import { localDateParts } from '@/modules/availability/windows';
import type { Estimate } from '@/modules/pricing/estimate';
import { euros, formatPhone, phoneHref } from '@/lib/text';

export const metadata = { title: 'Demande' };

const slotFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const row = (await db.select({ b: bookings, c: customers }).from(bookings).innerJoin(customers, eq(bookings.customerId, customers.id)).where(eq(bookings.id, id)))[0];
  if (!row) notFound();
  const { b, c } = row;
  const [v] = b.vehicleId ? await db.select().from(vehicles).where(eq(vehicles.id, b.vehicleId)) : [null];
  const [events, files, qs, services] = await Promise.all([
    db.select().from(bookingEvents).where(eq(bookingEvents.bookingId, id)).orderBy(desc(bookingEvents.createdAt)),
    db.select().from(attachments).where(eq(attachments.bookingId, id)),
    db.select().from(quotes).where(eq(quotes.bookingId, id)),
    listServices({ includeInactive: true }),
  ]);
  const est = b.estimate as Estimate | null;
  const selected = services.filter((s) => b.serviceSlugs.includes(s.slug));
  const duration = Math.max(60, selected.reduce((a, s) => a + s.durationMinutes, 0));
  const status = b.status as BookingStatus;
  const nextStatuses = (Object.keys(BOOKING_STATUSES) as BookingStatus[]).filter((s) => canTransition(status, s));
  const schedDate = b.scheduledStart ? localDateParts(b.scheduledStart, 'Europe/Paris').iso : b.preferredSlots[0] ? localDateParts(new Date(b.preferredSlots[0]), 'Europe/Paris').iso : '';
  const schedTime = b.scheduledStart ? timeFmt.format(b.scheduledStart) : b.preferredSlots[0] ? timeFmt.format(new Date(b.preferredSlots[0])) : '09:00';
  const fullAddress = `${b.address}, ${b.postcode} ${b.city}`;

  return (
    <>
      <AdminHeader
        back={{ href: '/admin/demandes', label: 'Demandes' }}
        title={`Demande ${b.reference}`}
        intro={<span className="inline-flex flex-wrap items-center gap-2"><BookingBadge status={b.status} /><DemoTag show={b.isDemo} /> Reçue le {dt.format(b.createdAt)}</span>}
        actions={<ActionForm action={createQuoteFromBooking} submitLabel={qs.length === 0 ? 'Créer un devis' : 'Nouveau devis'} submitClass="btn btn-outline-dark btn-sm"><input type="hidden" name="bookingId" value={b.id} /></ActionForm>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Panel title="Client">
            <p className="text-[1.25rem] font-semibold"><Link href={`/admin/clients/${c.id}`} className="link-u">{c.name}</Link></p>
            <ul className="mt-3 space-y-2">
              <li><a className="inline-flex min-h-[40px] items-center gap-2 link-u" href={phoneHref(c.phone)}><Phone className="size-4" aria-hidden="true" />{formatPhone(c.phone)}</a> <span className="text-mute">· préfère : {{ phone: 'appel', sms: 'SMS', email: 'e-mail' }[b.contactPreference as 'phone']}</span></li>
              {c.email && <li><a className="inline-flex min-h-[40px] items-center gap-2 link-u" href={`mailto:${c.email}`}><Mail className="size-4" aria-hidden="true" />{c.email}</a></li>}
              <li className="flex items-start gap-2"><MapPin className="mt-1 size-4 shrink-0" aria-hidden="true" /><span>{fullAddress}<span className="block text-[0.9375rem] text-mute">{b.zoneStatus === 'served' ? 'Dans la zone' : b.zoneStatus === 'on_request' ? 'Zone à confirmer' : 'Hors zone'}{b.distanceKm !== null && ` · ≈ ${b.distanceKm} km`}{b.travelFeeCents !== null && ` · déplacement ${b.travelFeeCents === 0 ? 'offert' : euros(b.travelFeeCents)}`}{b.travelMinutes ? ` · ≈ ${b.travelMinutes} min de trajet` : ''}</span></span></li>
              <li><a className="inline-flex min-h-[40px] items-center gap-2 text-[0.9375rem] link-u" target="_blank" rel="noopener noreferrer" href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(fullAddress)}`}><Navigation className="size-4" aria-hidden="true" />Ouvrir sur une carte</a></li>
            </ul>
          </Panel>
          <Panel title="Véhicule et intervention">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-mute">Véhicule</dt><dd className="font-semibold">{v ? vehicleLabel(v) : '—'}</dd>{v && <dd className="text-[0.9375rem] text-mute">{[v.fuel, v.plate, v.vin && `VIN ${v.vin}`, CATEGORY_LABELS[v.category as VehicleCategory]].filter(Boolean).join(' · ')} · {v.source === 'plate' ? `identifié par plaque (${v.lookupProvider})` : 'saisi manuellement'}</dd>}</div>
              <div><dt className="text-mute">Intervention</dt><dd className="font-semibold">{selected.map((s) => s.name).join(', ') || '—'}</dd>{b.unknownIssue && <dd className="text-[0.9375rem] text-warn">Le client ne connaît pas la panne</dd>}</div>
              <div className="sm:col-span-2"><dt className="text-mute">Description du client</dt><dd className="whitespace-pre-wrap">{b.description || '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-mute">Créneaux souhaités</dt><dd>{b.preferredSlots.length ? <ul className="list-disc pl-5">{b.preferredSlots.map((s) => <li key={s} className="first-letter:uppercase">{slotFmt.format(new Date(s))}</li>)}</ul> : 'Aucun (à convenir)'}{b.availabilityNote && <p className="mt-1 italic">« {b.availabilityNote} »</p>}</dd></div>
            </dl>
            {files.length > 0 && (
              <div className="mt-5"><p className="text-mute">Photos ({files.length})</p>
                <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">{files.map((f) => (
                  <li key={f.id}><a href={`/api/files/${f.id}`} target="_blank" className="block aspect-square overflow-hidden rounded-sm border border-graphite/10 bg-paper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {f.mime === 'image/heic' ? <span className="flex size-full items-center justify-center text-[0.8125rem]">HEIC</span> : <img src={`/api/files/${f.id}`} alt={f.originalName || 'Photo du client'} className="size-full object-cover" />}
                  </a></li>
                ))}</ul>
              </div>
            )}
          </Panel>
          {est && (
            <Panel title="Estimation affichée au client">
              <ul className="space-y-1">{est.lines.map((l) => <li key={l.label} className="flex justify-between gap-4"><span>{l.label}</span><span>{l.amountCents !== null ? euros(l.amountCents) : <span className="text-mute">{l.note}</span>}</span></li>)}</ul>
              {est.knownTotalCents !== null && <p className="mt-2 flex justify-between border-t border-graphite/10 pt-2 font-semibold"><span>Total connu (hors pièces)</span><span>{euros(est.knownTotalCents)}</span></p>}
              {est.demoPrices && <p className="mt-2 text-[0.875rem] text-champagne-ink">Calculée avec les tarifs de démonstration.</p>}
            </Panel>
          )}
          <Panel title="Notes">
            <ActionForm action={saveBookingNotes}>
              <input type="hidden" name="id" value={b.id} />
              <label className="field-label" htmlFor="internalNotes">Notes internes (non visibles du client)</label>
              <textarea id="internalNotes" name="internalNotes" className="input" rows={4} defaultValue={b.internalNotes} />
              <label className="field-label mt-4" htmlFor="description">Description de la demande</label>
              <textarea id="description" name="description" className="input" rows={3} defaultValue={b.description} />
            </ActionForm>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Planifier l’intervention">
            <ActionForm action={scheduleBooking} submitLabel={b.scheduledStart ? 'Déplacer le rendez-vous' : 'Planifier'}>
              <input type="hidden" name="id" value={b.id} />
              {b.scheduledStart && <p className="mb-4 rounded-sm bg-paper p-3">Prévu : <strong className="first-letter:uppercase">{slotFmt.format(b.scheduledStart)}</strong></p>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="field-label" htmlFor="date">Date</label><input id="date" name="date" type="date" className="input" defaultValue={schedDate} required /></div>
                <div><label className="field-label" htmlFor="time">Heure</label><input id="time" name="time" type="time" className="input" defaultValue={schedTime} required /></div>
                <div><label className="field-label" htmlFor="duration">Durée (min)</label><input id="duration" name="duration" type="number" min={15} step={1} className="input" defaultValue={b.scheduledStart && b.scheduledEnd ? Math.round((b.scheduledEnd.getTime() - b.scheduledStart.getTime()) / 60000) : duration} /></div>
                <div><label className="field-label" htmlFor="travel">Trajet (min)</label><input id="travel" name="travel" type="number" min={0} step={1} className="input" defaultValue={b.travelMinutes ?? 0} /></div>
              </div>
              {canTransition(status, 'confirmee') && <label className="mt-4 flex items-center gap-3"><input type="checkbox" name="confirm" defaultChecked className="size-5 accent-graphite" /> Confirmer le rendez-vous</label>}
              <label className="mt-2 flex items-center gap-3"><input type="checkbox" name="notify" className="size-5 accent-graphite" /> Prévenir le client (e-mail / SMS selon configuration)</label>
            </ActionForm>
          </Panel>
          <Panel title="Statut">
            {nextStatuses.length === 0 ? <p className="text-mute">Aucun changement possible depuis « {BOOKING_STATUSES[status]} ».</p> : (
              <ActionForm action={setBookingStatus} submitLabel="Changer le statut">
                <input type="hidden" name="id" value={b.id} />
                <label className="field-label" htmlFor="status">Nouveau statut</label>
                <select id="status" name="status" className="input" defaultValue={nextStatuses[0]}>{nextStatuses.map((s) => <option key={s} value={s}>{BOOKING_STATUSES[s]}</option>)}</select>
                <label className="field-label mt-4" htmlFor="note">Commentaire (motif d’annulation, etc.)</label>
                <input id="note" name="note" className="input" maxLength={500} />
                <label className="mt-3 flex items-center gap-3"><input type="checkbox" name="notify" className="size-5 accent-graphite" /> Prévenir le client</label>
              </ActionForm>
            )}
          </Panel>
          {qs.length > 0 && (
            <Panel title="Devis">
              <ul className="space-y-2">{qs.map((q) => <li key={q.id} className="flex items-center justify-between gap-3"><Link className="font-mono link-u" href={`/admin/devis/${q.id}`}>{q.number}</Link><QuoteBadge status={q.status} /><span>{euros(q.totalTtcCents, { decimals: true })}</span></li>)}</ul>
            </Panel>
          )}
          <Panel title="Historique">
            <ol className="space-y-3 text-[0.9375rem]">
              {events.map((e) => (
                <li key={e.id} className="border-l-2 border-graphite/10 pl-3">
                  <p className="text-mute">{dt.format(e.createdAt)} · {e.actor}</p>
                  <p>{e.type === 'created' ? 'Demande créée' : e.type === 'status' ? `Statut : ${BOOKING_STATUSES[e.toStatus as BookingStatus] ?? e.toStatus}` : e.type === 'scheduled' ? 'Planifiée' : e.type === 'rescheduled' ? 'Déplacée' : e.type}{e.note ? ` — ${e.note}` : ''}</p>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Zone sensible">
            <ActionForm action={deleteBooking} submitLabel="Supprimer définitivement la demande" submitClass="btn btn-sm border border-danger/50 text-danger hover:bg-danger/5" confirm="Supprimer définitivement cette demande ? Cette action est irréversible.">
              <input type="hidden" name="id" value={b.id} />
              <p className="text-[0.9375rem] text-mute">À utiliser pour une demande erronée ou sur demande d’effacement du client (RGPD). Préférez « Annulée » sinon.</p>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
