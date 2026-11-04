import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { FileDown } from 'lucide-react';
import { getDb } from '@/db/client';
import { quotes, customers } from '@/db/schema';
import { getQuoteWithLines } from '@/modules/quotes/service';
import { LINE_KINDS, QUOTE_STATUSES, isQuoteExpired, type LineKind } from '@/modules/quotes/totals';
import { QuoteResponse } from './QuoteResponse';
import { euros } from '@/lib/text';
import { getSite } from '@/lib/site';

export const metadata: Metadata = { title: 'Votre devis', robots: { index: false, follow: false } };
const d = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' });

export default async function PublicQuote({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  const db = await getDb();
  const q = (await db.select().from(quotes).where(eq(quotes.publicToken, token)))[0];
  if (!q || q.status === 'brouillon') notFound();
  const { lines } = (await getQuoteWithLines(q.id))!;
  const c = (await db.select().from(customers).where(eq(customers.id, q.customerId)))[0];
  const site = await getSite();
  const expired = isQuoteExpired(q);
  return (
    <section className="bg-paper">
      <div className="container-x py-14">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow text-champagne-ink">Devis {q.number}</p>
          <h1 className="mt-3 text-h2 font-light wide">{q.title}</h1>
          <p className="mt-3 text-mute">Pour {c.name}{q.vehicleLabel ? ` · ${q.vehicleLabel}` : ''} · émis le {d.format(q.createdAt)}{q.validUntil ? ` · valable jusqu’au ${d.format(q.validUntil)}` : ''}</p>
          <p className="mt-2"><span className="badge bg-graphite/10">{expired ? 'Expiré' : QUOTE_STATUSES[q.status as keyof typeof QUOTE_STATUSES]}</span></p>
          <div className="mt-8 overflow-x-auto rounded-sm border border-graphite/10 bg-white">
            <table className="w-full min-w-[520px] text-left">
              <thead className="border-b border-graphite/10 text-[0.875rem] text-mute"><tr><th className="px-4 py-3 font-medium">Désignation</th><th className="px-4 py-3 text-right font-medium">Qté</th><th className="px-4 py-3 text-right font-medium">PU HT</th><th className="px-4 py-3 text-right font-medium">Total HT</th></tr></thead>
              <tbody className="divide-y divide-graphite/10">
                {lines.map((l) => <tr key={l.id}><td className="px-4 py-3"><span className="block text-[0.8125rem] text-mute">{LINE_KINDS[l.kind as LineKind]}</span>{l.label}{l.reference && <span className="text-mute"> · réf. {l.reference}</span>}</td><td className="px-4 py-3 text-right tabular-nums">{Number(l.quantity).toLocaleString('fr-FR')}</td><td className="px-4 py-3 text-right tabular-nums">{euros(l.unitPriceHtCents, { decimals: true })}</td><td className="px-4 py-3 text-right tabular-nums">{euros(Math.round(Number(l.quantity) * l.unitPriceHtCents), { decimals: true })}</td></tr>)}
              </tbody>
              <tfoot className="border-t border-graphite/20">
                <tr><td colSpan={3} className="px-4 py-2 text-right">Total HT</td><td className="px-4 py-2 text-right tabular-nums">{euros(q.totalHtCents, { decimals: true })}</td></tr>
                {q.vatMode === 'normal' && <tr><td colSpan={3} className="px-4 py-2 text-right">TVA</td><td className="px-4 py-2 text-right tabular-nums">{euros(q.totalVatCents, { decimals: true })}</td></tr>}
                <tr className="font-semibold"><td colSpan={3} className="px-4 py-3 text-right">{q.vatMode === 'normal' ? 'Total TTC' : 'Total à payer'}</td><td className="px-4 py-3 text-right text-[1.125rem] tabular-nums">{euros(q.totalTtcCents, { decimals: true })}</td></tr>
              </tfoot>
            </table>
          </div>
          {q.vatMode === 'franchise' && <p className="mt-2 text-right text-[0.875rem] text-mute">TVA non applicable, art. 293 B du CGI</p>}
          {q.notes && <p className="mt-6 whitespace-pre-wrap text-mute">{q.notes}</p>}
          <a href={`/devis/${token}/pdf`} className="btn btn-outline-dark mt-8"><FileDown className="size-5" aria-hidden="true" /> Télécharger en PDF</a>
          <div className="mt-10 rounded-sm border border-graphite/15 bg-white p-6">
            {q.status === 'envoye' && !expired ? <QuoteResponse token={token} /> : q.status === 'accepte' ? <p>Devis accepté le {d.format(q.acceptedAt!)}. Merci !</p> : <p className="text-mute">Ce devis n’est plus modifiable en ligne. Pour toute question : <a className="link-u" href={site.phoneHref}>{site.business.phone}</a>.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
