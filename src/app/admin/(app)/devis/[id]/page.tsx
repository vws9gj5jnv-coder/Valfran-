import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { FileDown, ExternalLink } from 'lucide-react';
import { getDb } from '@/db/client';
import { customers, quoteEvents, bookings } from '@/db/schema';
import { getQuoteWithLines } from '@/modules/quotes/service';
import { AdminHeader, Panel, QuoteBadge, DemoTag, dt } from '@/components/admin/ui';
import { ActionForm } from '@/components/admin/ActionForm';
import { QuoteEditor } from '@/components/admin/QuoteEditor';
import { sendQuote, setQuoteStatus, duplicateQuote, deleteQuote } from '@/modules/admin/quotes-actions';
import { QUOTE_STATUSES } from '@/modules/quotes/totals';
import { localDateParts } from '@/modules/availability/windows';
import { env } from '@/lib/env';

export const metadata = { title: 'Devis' };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getQuoteWithLines(id);
  if (!data) notFound();
  const { q, lines } = data;
  const db = await getDb();
  const c = (await db.select().from(customers).where(eq(customers.id, q.customerId)))[0];
  const b = q.bookingId ? (await db.select().from(bookings).where(eq(bookings.id, q.bookingId)))[0] : null;
  const events = await db.select().from(quoteEvents).where(eq(quoteEvents.quoteId, id)).orderBy(desc(quoteEvents.createdAt));
  const link = `${env.siteUrl}/devis/${q.publicToken}`;
  return (
    <>
      <AdminHeader back={{ href: '/admin/devis', label: 'Devis' }} title={`Devis ${q.number}`}
        intro={<span className="inline-flex flex-wrap items-center gap-2"><QuoteBadge status={q.status} /><DemoTag show={q.isDemo} /> Client : <Link className="link-u" href={`/admin/clients/${c.id}`}>{c.name}</Link>{b && <> · Demande <Link className="link-u" href={`/admin/demandes/${b.id}`}>{b.reference}</Link></>}</span>}
        actions={<a className="btn btn-outline-dark btn-sm" href={`/api/admin/quotes/${q.id}/pdf`} target="_blank"><FileDown className="size-4" aria-hidden="true" /> PDF</a>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Panel title="Contenu du devis">
          <QuoteEditor locked={q.status === 'accepte'} quote={{ id: q.id, title: q.title, vehicleLabel: q.vehicleLabel, notes: q.notes, vatMode: q.vatMode as 'franchise' | 'normal', validUntil: q.validUntil ? localDateParts(q.validUntil, 'Europe/Paris').iso : '' }}
            initialLines={lines.map((l) => ({ kind: l.kind, label: l.label, reference: l.reference, quantity: Number(l.quantity), unitPriceHtCents: l.unitPriceHtCents, vatRate: Number(l.vatRate) }))} />
        </Panel>
        <div className="space-y-6">
          <Panel title="Envoi au client">
            <ActionForm action={sendQuote} submitLabel={q.sentAt ? 'Renvoyer' : 'Envoyer le devis'} submitClass="btn btn-accent btn-sm">
              <input type="hidden" name="id" value={q.id} />
              <p className="text-[0.9375rem] text-mute">Par e-mail ({c.email || 'aucun e-mail'}) ou, à défaut, par SMS. Enregistrez vos modifications avant d’envoyer.{env.demoMode && ' En démonstration, l’envoi est simulé.'}</p>
              {q.sentAt && <p className="mt-2 text-[0.9375rem]">Dernier envoi : {dt.format(q.sentAt)}</p>}
            </ActionForm>
            {q.status !== 'brouillon' && <p className="mt-4 break-all text-[0.875rem]"><a className="inline-flex items-center gap-1 link-u" href={link} target="_blank"><ExternalLink className="size-4" aria-hidden="true" />Lien client</a> <span className="text-mute">{link}</span></p>}
          </Panel>
          <Panel title="Statut">
            <ActionForm action={setQuoteStatus} submitLabel="Mettre à jour">
              <input type="hidden" name="id" value={q.id} />
              <select name="status" className="input" defaultValue={q.status} aria-label="Statut du devis">{Object.entries(QUOTE_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <input name="note" className="input mt-3" placeholder="Commentaire (ex. : accepté par téléphone)" aria-label="Commentaire" />
            </ActionForm>
            {q.acceptedAt && <p className="mt-4 text-[0.9375rem]">Accepté le {dt.format(q.acceptedAt)} par <strong>{q.acceptedByName}</strong>{q.acceptedIpHash && <span className="block text-mute">Empreinte connexion : {q.acceptedIpHash.slice(0, 12)}… · {q.acceptedUserAgent?.slice(0, 60)}</span>}</p>}
          </Panel>
          <Panel title="Historique">
            <ol className="space-y-2 text-[0.9375rem]">{events.map((e) => <li key={e.id} className="border-l-2 border-graphite/10 pl-3"><span className="text-mute">{dt.format(e.createdAt)} · {e.actor}</span><br />{e.type}{e.note && ` — ${e.note}`}</li>)}</ol>
          </Panel>
          <div className="flex flex-wrap gap-2">
            <ActionForm action={duplicateQuote} submitLabel="Dupliquer" submitClass="btn btn-outline-dark btn-sm"><input type="hidden" name="id" value={q.id} /></ActionForm>
            {q.status === 'brouillon' && <ActionForm action={deleteQuote} submitLabel="Supprimer le brouillon" submitClass="btn btn-sm border border-danger/50 text-danger" confirm="Supprimer ce brouillon ?"><input type="hidden" name="id" value={q.id} /></ActionForm>}
          </div>
        </div>
      </div>
    </>
  );
}
