import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { quotes, customers } from '@/db/schema';
import { AdminHeader, QuoteBadge, Empty, DemoTag, dt } from '@/components/admin/ui';
import { isQuoteExpired } from '@/modules/quotes/totals';
import { euros } from '@/lib/text';

export const metadata = { title: 'Devis' };

export default async function QuotesPage() {
  const db = await getDb();
  const rows = await db.select({ q: quotes, c: customers }).from(quotes).innerJoin(customers, eq(quotes.customerId, customers.id)).orderBy(desc(quotes.createdAt)).limit(300);
  return (
    <>
      <AdminHeader title="Devis" intro="Un devis se crée depuis une demande ou depuis une fiche client. Estimation (en ligne), devis (engagement après acceptation) et facture sont trois documents distincts." />
      <div className="overflow-x-auto rounded-sm border border-graphite/10 bg-white">
        {rows.length === 0 ? <Empty>Aucun devis.</Empty> : (
          <table className="w-full min-w-[760px] text-left text-[0.9688rem]">
            <thead className="border-b border-graphite/10 text-[0.875rem] text-mute"><tr>{['Numéro', 'Client', 'Objet', 'Montant', 'Statut', 'Créé le'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-graphite/10">
              {rows.map(({ q, c }) => (
                <tr key={q.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3"><Link href={`/admin/devis/${q.id}`} className="font-mono font-semibold link-u">{q.number}</Link></td>
                  <td className="px-4 py-3">{c.name}<DemoTag show={q.isDemo} /></td>
                  <td className="px-4 py-3">{q.title}</td>
                  <td className="px-4 py-3 tabular-nums">{euros(q.totalTtcCents, { decimals: true })}</td>
                  <td className="px-4 py-3">{isQuoteExpired(q) ? <span className="badge bg-graphite/10">Expiré</span> : <QuoteBadge status={q.status} />}</td>
                  <td className="px-4 py-3 text-mute">{dt.format(q.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
