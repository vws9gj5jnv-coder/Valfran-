import Link from 'next/link';
import { desc, ilike, or, sql, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { customers, bookings } from '@/db/schema';
import { AdminHeader, Empty, DemoTag, dt } from '@/components/admin/ui';
import { formatPhone } from '@/lib/text';

export const metadata = { title: 'Clients' };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const db = await getDb();
  const like = q ? `%${q.slice(0, 60)}%` : null;
  const rows = await db.select({ c: customers, n: sql<number>`count(${bookings.id})::int`, last: sql<Date>`max(${bookings.createdAt})` })
    .from(customers).leftJoin(bookings, eq(bookings.customerId, customers.id))
    .where(like ? or(ilike(customers.name, like), ilike(customers.phone, like), ilike(customers.email, like), ilike(customers.city, like)) : undefined)
    .groupBy(customers.id).orderBy(desc(customers.updatedAt)).limit(300);
  return (
    <>
      <AdminHeader title="Clients" intro="Fiches créées automatiquement à chaque demande (rapprochement par numéro de téléphone)." />
      <form className="mb-5 flex gap-2" role="search"><label htmlFor="cq" className="sr-only">Rechercher</label><input id="cq" name="q" defaultValue={q} className="input min-h-[44px] max-w-sm" placeholder="Nom, téléphone, e-mail, commune…" /><button className="btn btn-dark btn-sm">Rechercher</button></form>
      <div className="overflow-x-auto rounded-sm border border-graphite/10 bg-white">
        {rows.length === 0 ? <Empty>Aucun client.</Empty> : (
          <table className="w-full min-w-[720px] text-left text-[0.9688rem]">
            <thead className="border-b border-graphite/10 text-[0.875rem] text-mute"><tr>{['Nom', 'Téléphone', 'Commune', 'Demandes', 'Dernière demande'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-graphite/10">
              {rows.map(({ c, n, last }) => (
                <tr key={c.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3"><Link className="font-semibold link-u" href={`/admin/clients/${c.id}`}>{c.name}</Link><DemoTag show={c.isDemo} /></td>
                  <td className="px-4 py-3 tabular-nums">{formatPhone(c.phone)}</td>
                  <td className="px-4 py-3">{c.city}</td>
                  <td className="px-4 py-3">{n}</td>
                  <td className="px-4 py-3 text-mute">{last ? dt.format(new Date(last)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
