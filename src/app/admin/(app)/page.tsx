import Link from 'next/link';
import { and, desc, eq, gte, lt, sql, inArray } from 'drizzle-orm';
import { ArrowRight } from 'lucide-react';
import { getDb } from '@/db/client';
import { bookings, customers, quotes, messages, vehicles } from '@/db/schema';
import { AdminHeader, Panel, BookingBadge, Empty, DemoTag, tOnly, dt } from '@/components/admin/ui';
import { zonedToUtc, localDateParts } from '@/modules/availability/windows';
import { vehicleLabel } from '@/modules/vehicles/catalog';
import { euros } from '@/lib/text';

export const metadata = { title: 'Tableau de bord' };

export default async function Dashboard() {
  const db = await getDb();
  const today = localDateParts(new Date(), 'Europe/Paris').iso;
  const start = zonedToUtc(today, '00:00', 'Europe/Paris');
  const end = new Date(start.getTime() + 86400_000);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const [[newCount], [studyCount], [quoteCount], [customerCount], [monthCount], [doneMonth], [msgCount], [acceptedSum]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(bookings).where(eq(bookings.status, 'nouvelle')),
    db.select({ n: sql<number>`count(*)::int` }).from(bookings).where(inArray(bookings.status, ['a_etudier', 'devis_necessaire'])),
    db.select({ n: sql<number>`count(*)::int` }).from(quotes).where(inArray(quotes.status, ['brouillon', 'envoye'])),
    db.select({ n: sql<number>`count(*)::int` }).from(customers),
    db.select({ n: sql<number>`count(*)::int` }).from(bookings).where(gte(bookings.createdAt, monthStart)),
    db.select({ n: sql<number>`count(*)::int` }).from(bookings).where(and(eq(bookings.status, 'terminee'), gte(bookings.updatedAt, monthStart))),
    db.select({ n: sql<number>`count(*)::int` }).from(messages).where(eq(messages.status, 'nouveau')),
    db.select({ n: sql<number>`coalesce(sum(total_ttc_cents),0)::int` }).from(quotes).where(and(eq(quotes.status, 'accepte'), gte(quotes.acceptedAt, monthStart))),
  ]);
  const todays = await db.select({ b: bookings, c: customers }).from(bookings).innerJoin(customers, eq(bookings.customerId, customers.id))
    .where(and(eq(bookings.status, 'confirmee'), gte(bookings.scheduledStart, start), lt(bookings.scheduledStart, end))).orderBy(bookings.scheduledStart);
  const upcoming = await db.select({ b: bookings, c: customers }).from(bookings).innerJoin(customers, eq(bookings.customerId, customers.id))
    .where(and(eq(bookings.status, 'confirmee'), gte(bookings.scheduledStart, end))).orderBy(bookings.scheduledStart).limit(5);
  const latest = await db.select({ b: bookings, c: customers, v: vehicles }).from(bookings).innerJoin(customers, eq(bookings.customerId, customers.id)).leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(inArray(bookings.status, ['nouvelle', 'a_etudier', 'devis_necessaire'])).orderBy(desc(bookings.createdAt)).limit(8);

  const kpis = [
    { label: 'Nouvelles demandes', value: newCount.n, href: '/admin/demandes?statut=nouvelle', accent: newCount.n > 0 },
    { label: 'À étudier / devis', value: studyCount.n, href: '/admin/demandes?statut=a_etudier' },
    { label: 'Devis en cours', value: quoteCount.n, href: '/admin/devis' },
    { label: 'Messages non traités', value: msgCount.n, href: '/admin/messages' },
  ];
  return (
    <>
      <AdminHeader title="Tableau de bord" intro={new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeZone: 'Europe/Paris' }).format(new Date())} actions={<Link className="btn btn-dark btn-sm" href="/admin/planning">Planning</Link>} />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.label}><Link href={k.href} className={`block rounded-sm border p-5 transition-colors hover:border-graphite ${k.accent ? 'border-champagne bg-[#f7f2ea]' : 'border-graphite/10 bg-white'}`}>
            <p className="text-mute">{k.label}</p><p className="mt-2 text-[2.25rem] font-light leading-none wide tabular-nums">{k.value}</p>
          </Link></li>
        ))}
      </ul>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Demandes à traiter" actions={<Link href="/admin/demandes" className="text-[0.9375rem] link-u">Tout voir</Link>}>
          {latest.length === 0 ? <Empty>Aucune demande en attente.</Empty> : (
            <ul className="-my-2 divide-y divide-graphite/10">
              {latest.map(({ b, c, v }) => (
                <li key={b.id}><Link href={`/admin/demandes/${b.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-paper/60">
                  <span className="min-w-[7.5rem] font-mono text-[0.875rem]">{b.reference}</span>
                  <span className="flex-1"><span className="font-semibold">{c.name}</span><DemoTag show={b.isDemo} /><span className="block text-[0.9375rem] text-mute">{v ? vehicleLabel(v) : '—'} · {b.city}</span></span>
                  <BookingBadge status={b.status} />
                  <span className="text-[0.875rem] text-mute">{dt.format(b.createdAt)}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="space-y-6">
          <Panel title={`Aujourd’hui (${todays.length})`}>
            {todays.length === 0 ? <Empty>Aucune intervention aujourd’hui.</Empty> : (
              <ul className="space-y-3">{todays.map(({ b, c }) => (
                <li key={b.id}><Link href={`/admin/demandes/${b.id}`} className="flex gap-4 hover:underline"><span className="font-semibold tabular-nums">{tOnly.format(b.scheduledStart!)}</span><span>{c.name} — {b.city}</span></Link></li>
              ))}</ul>
            )}
          </Panel>
          <Panel title="Prochains rendez-vous">
            {upcoming.length === 0 ? <Empty>Aucun rendez-vous planifié.</Empty> : (
              <ul className="space-y-3">{upcoming.map(({ b, c }) => (
                <li key={b.id}><Link href={`/admin/demandes/${b.id}`} className="flex items-center justify-between gap-4 hover:underline"><span>{dt.format(b.scheduledStart!)}</span><span className="text-right">{c.name} · {b.city}</span></Link></li>
              ))}</ul>
            )}
          </Panel>
          <Panel title="Ce mois-ci">
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="text-mute">Demandes reçues</dt><dd className="text-[1.5rem] font-light tabular-nums">{monthCount.n}</dd></div>
              <div><dt className="text-mute">Interventions terminées</dt><dd className="text-[1.5rem] font-light tabular-nums">{doneMonth.n}</dd></div>
              <div><dt className="text-mute">Devis acceptés</dt><dd className="text-[1.5rem] font-light tabular-nums">{euros(acceptedSum.n) || '0 €'}</dd></div>
              <div><dt className="text-mute">Clients</dt><dd className="text-[1.5rem] font-light tabular-nums">{customerCount.n}</dd></div>
            </dl>
            <Link href="/admin/clients" className="mt-4 inline-flex items-center gap-1 text-[0.9375rem] link-u">Fichier clients <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </Panel>
        </div>
      </div>
    </>
  );
}
