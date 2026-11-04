import Link from 'next/link';
import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { bookings, customers, vehicles } from '@/db/schema';
import { AdminHeader, BookingBadge, Empty, DemoTag, dt } from '@/components/admin/ui';
import { BOOKING_STATUSES, isBookingStatus } from '@/modules/bookings/status';
import { listServices } from '@/modules/settings/repo';
import { vehicleLabel } from '@/modules/vehicles/catalog';

export const metadata = { title: 'Demandes' };

export default async function DemandesPage({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string }> }) {
  const { statut, q } = await searchParams;
  const db = await getDb();
  const where: SQL[] = [];
  if (statut && isBookingStatus(statut)) where.push(eq(bookings.status, statut));
  if (q) {
    const like = `%${q.slice(0, 60)}%`;
    where.push(or(ilike(customers.name, like), ilike(customers.phone, like), ilike(bookings.reference, like), ilike(bookings.city, like), ilike(vehicles.plate, like))!);
  }
  const rows = await db.select({ b: bookings, c: customers, v: vehicles }).from(bookings).innerJoin(customers, eq(bookings.customerId, customers.id)).leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(where.length ? and(...where) : undefined).orderBy(desc(bookings.createdAt)).limit(200);
  const services = await listServices({ includeInactive: true });
  const name = (s: string) => services.find((x) => x.slug === s)?.name ?? s;
  return (
    <>
      <AdminHeader title="Demandes" intro="Toutes les demandes reçues depuis le site. Cliquez sur une ligne pour la traiter." />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-1.5">
          {[['', 'Toutes'], ...Object.entries(BOOKING_STATUSES)].map(([k, label]) => (
            <Link key={k} href={k ? `/admin/demandes?statut=${k}` : '/admin/demandes'} aria-current={(statut ?? '') === k ? 'page' : undefined}
              className={`inline-flex min-h-[40px] items-center rounded-sm border px-3 text-[0.9375rem] ${(statut ?? '') === k ? 'border-graphite bg-graphite text-paper' : 'border-graphite/15 bg-white hover:border-graphite/40'}`}>{label}</Link>
          ))}
        </nav>
        <form className="flex gap-2" role="search">
          {statut && <input type="hidden" name="statut" value={statut} />}
          <label htmlFor="q" className="sr-only">Rechercher</label>
          <input id="q" name="q" defaultValue={q} placeholder="Nom, téléphone, référence, plaque…" className="input min-h-[44px] w-72" />
          <button className="btn btn-dark btn-sm">Rechercher</button>
        </form>
      </div>
      <div className="overflow-x-auto rounded-sm border border-graphite/10 bg-white">
        {rows.length === 0 ? <Empty>Aucune demande.</Empty> : (
          <table className="w-full min-w-[860px] text-left text-[0.9688rem]">
            <thead className="border-b border-graphite/10 text-[0.875rem] text-mute"><tr>{['Référence', 'Client', 'Véhicule', 'Intervention', 'Commune', 'Statut', 'Reçue le'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-graphite/10">
              {rows.map(({ b, c, v }) => (
                <tr key={b.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3"><Link className="font-mono font-semibold link-u" href={`/admin/demandes/${b.id}`}>{b.reference}</Link></td>
                  <td className="px-4 py-3">{c.name}<DemoTag show={b.isDemo} /></td>
                  <td className="px-4 py-3">{v ? vehicleLabel(v) : '—'}</td>
                  <td className="px-4 py-3">{b.serviceSlugs.map(name).join(', ')}</td>
                  <td className="px-4 py-3">{b.city}{b.zoneStatus !== 'served' && <span className="block text-[0.8125rem] text-warn">zone à vérifier</span>}</td>
                  <td className="px-4 py-3"><BookingBadge status={b.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-mute">{dt.format(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
