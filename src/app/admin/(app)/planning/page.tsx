import Link from 'next/link';
import { and, eq, gte, lt, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { bookings, customers, closures } from '@/db/schema';
import { AdminHeader, BookingBadge } from '@/components/admin/ui';
import { zonedToUtc, localDateParts } from '@/modules/availability/windows';
import { getSetting, listServices } from '@/modules/settings/repo';

export const metadata = { title: 'Planning' };
const dayFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' });
const hm = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });

function mondayOf(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  const wd = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - wd);
  return d.toISOString().slice(0, 10);
}
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export default async function PlanningPage({ searchParams }: { searchParams: Promise<{ semaine?: string }> }) {
  const sp = await searchParams;
  const today = localDateParts(new Date(), 'Europe/Paris').iso;
  const monday = mondayOf(sp.semaine && /^\d{4}-\d{2}-\d{2}$/.test(sp.semaine) ? sp.semaine : today);
  const from = zonedToUtc(monday, '00:00', 'Europe/Paris');
  const to = zonedToUtc(addDays(monday, 7), '00:00', 'Europe/Paris');
  const db = await getDb();
  const [rows, offs, avail, services] = await Promise.all([
    db.select({ b: bookings, c: customers }).from(bookings).innerJoin(customers, eq(bookings.customerId, customers.id))
      .where(and(inArray(bookings.status, ['confirmee', 'terminee', 'a_etudier', 'devis_necessaire', 'nouvelle']), gte(bookings.scheduledStart, from), lt(bookings.scheduledStart, to))).orderBy(bookings.scheduledStart),
    db.select().from(closures).where(and(lt(closures.startsAt, to), gte(closures.endsAt, from))),
    getSetting('availability'),
    listServices({ includeInactive: true }),
  ]);
  const toPlan = await db.select({ b: bookings, c: customers }).from(bookings).innerJoin(customers, eq(bookings.customerId, customers.id)).where(and(inArray(bookings.status, ['nouvelle', 'a_etudier', 'devis_necessaire']))).orderBy(bookings.createdAt).limit(20);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const sname = (s: string) => services.find((x) => x.slug === s)?.name ?? s;
  return (
    <>
      <AdminHeader title="Planning" intro={`Semaine du ${dayFmt.format(from)}`} actions={<>
        <Link className="btn btn-outline-dark btn-sm" href={`/admin/planning?semaine=${addDays(monday, -7)}`}>← Semaine précédente</Link>
        <Link className="btn btn-outline-dark btn-sm" href="/admin/planning">Cette semaine</Link>
        <Link className="btn btn-outline-dark btn-sm" href={`/admin/planning?semaine=${addDays(monday, 7)}`}>Semaine suivante →</Link>
      </>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <ol className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {days.map((d, i) => {
            const items = rows.filter(({ b }) => localDateParts(b.scheduledStart!, 'Europe/Paris').iso === d);
            const dayStart = zonedToUtc(d, '00:00', 'Europe/Paris'), dayEnd = zonedToUtc(d, '23:59', 'Europe/Paris');
            const off = offs.find((c) => c.startsAt <= dayEnd && c.endsAt >= dayStart);
            const hours = avail.weekly[String(i + 1)] ?? [];
            return (
              <li key={d} className={`rounded-sm border bg-white p-4 ${d === today ? 'border-graphite' : 'border-graphite/10'}`}>
                <p className="flex items-baseline justify-between"><span className="font-semibold first-letter:uppercase">{dayFmt.format(dayStart)}</span><span className="text-[0.8125rem] text-mute">{hours.length ? hours.map((h) => `${h.start}–${h.end}`).join(' / ') : 'fermé'}</span></p>
                {off && <p className="mt-2 rounded-xs bg-[#f3e3c3] px-2 py-1 text-[0.875rem]">{off.kind === 'conges' ? 'Congés' : 'Indisponible'}{off.reason && ` — ${off.reason}`}</p>}
                <ul className="mt-3 space-y-2">
                  {items.length === 0 && !off && <li className="text-[0.9375rem] text-mute">Aucune intervention</li>}
                  {items.map(({ b, c }) => (
                    <li key={b.id}><Link href={`/admin/demandes/${b.id}`} className="block rounded-sm border border-graphite/10 p-3 hover:border-graphite">
                      <p className="flex justify-between gap-2"><span className="font-semibold tabular-nums">{hm.format(b.scheduledStart!)}{b.scheduledEnd && `–${hm.format(b.scheduledEnd)}`}</span><BookingBadge status={b.status} /></p>
                      <p className="mt-1">{c.name} · {b.city}</p>
                      <p className="text-[0.875rem] text-mute">{b.serviceSlugs.map(sname).join(', ')}{b.travelMinutes ? ` · trajet ≈ ${b.travelMinutes} min` : ''}</p>
                    </Link></li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
        <aside className="rounded-sm border border-graphite/10 bg-white p-4">
          <h2 className="font-semibold">À planifier ({toPlan.filter(({ b }) => !b.scheduledStart).length})</h2>
          <ul className="mt-3 space-y-2">
            {toPlan.filter(({ b }) => !b.scheduledStart).map(({ b, c }) => (
              <li key={b.id}><Link href={`/admin/demandes/${b.id}`} className="block rounded-sm border border-graphite/10 p-3 hover:border-graphite"><span className="font-mono text-[0.8125rem]">{b.reference}</span><span className="block">{c.name} · {b.city}</span><span className="text-[0.875rem] text-mute">{b.serviceSlugs.map(sname).join(', ')}</span></Link></li>
            ))}
          </ul>
          <Link href="/admin/disponibilites" className="mt-4 inline-block text-[0.9375rem] link-u">Gérer horaires et congés</Link>
        </aside>
      </div>
    </>
  );
}
