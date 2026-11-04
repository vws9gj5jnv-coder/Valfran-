import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { customers, vehicles, bookings, quotes } from '@/db/schema';
import { AdminHeader, Panel, BookingBadge, QuoteBadge, DemoTag, Empty, dt } from '@/components/admin/ui';
import { ActionForm } from '@/components/admin/ActionForm';
import { saveCustomer, anonymizeCustomer } from '@/modules/admin/customers-actions';
import { createQuoteForCustomer } from '@/modules/admin/quotes-actions';
import { listServices } from '@/modules/settings/repo';
import { vehicleLabel } from '@/modules/vehicles/catalog';
import { euros, formatPhone } from '@/lib/text';

export const metadata = { title: 'Client' };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const c = (await db.select().from(customers).where(eq(customers.id, id)))[0];
  if (!c) notFound();
  const [vs, bs, qs, services] = await Promise.all([
    db.select().from(vehicles).where(eq(vehicles.customerId, id)).orderBy(desc(vehicles.createdAt)),
    db.select().from(bookings).where(eq(bookings.customerId, id)).orderBy(desc(bookings.createdAt)),
    db.select().from(quotes).where(eq(quotes.customerId, id)).orderBy(desc(quotes.createdAt)),
    listServices({ includeInactive: true }),
  ]);
  const sname = (s: string) => services.find((x) => x.slug === s)?.name ?? s;
  return (
    <>
      <AdminHeader back={{ href: '/admin/clients', label: 'Clients' }} title={c.name} intro={<>Client depuis le {dt.format(c.createdAt)}<DemoTag show={c.isDemo} />{c.anonymizedAt && ' · anonymisé'}</>}
        actions={<ActionForm action={createQuoteForCustomer} submitLabel="Nouveau devis" submitClass="btn btn-outline-dark btn-sm"><input type="hidden" name="customerId" value={c.id} /></ActionForm>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Panel title="Coordonnées et notes">
          <ActionForm action={saveCustomer}>
            <input type="hidden" name="id" value={c.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="field-label" htmlFor="name">Nom</label><input id="name" name="name" className="input" defaultValue={c.name} /></div>
              <div><label className="field-label" htmlFor="phone">Téléphone</label><input id="phone" name="phone" className="input" defaultValue={formatPhone(c.phone)} /></div>
              <div><label className="field-label" htmlFor="email">E-mail</label><input id="email" name="email" className="input" defaultValue={c.email ?? ''} /></div>
              <div className="sm:col-span-2"><label className="field-label" htmlFor="address">Adresse</label><input id="address" name="address" className="input" defaultValue={c.address} /></div>
              <div><label className="field-label" htmlFor="postcode">Code postal</label><input id="postcode" name="postcode" className="input" defaultValue={c.postcode} /></div>
              <div><label className="field-label" htmlFor="city">Commune</label><input id="city" name="city" className="input" defaultValue={c.city} /></div>
              <div className="sm:col-span-2"><label className="field-label" htmlFor="notes">Notes internes</label><textarea id="notes" name="notes" className="input" rows={4} defaultValue={c.notes} /></div>
            </div>
          </ActionForm>
        </Panel>
        <div className="space-y-6">
          <Panel title="Véhicules">{vs.length === 0 ? <Empty>Aucun véhicule.</Empty> : <ul className="divide-y divide-graphite/10">{vs.map((v) => <li key={v.id} className="py-2"><span className="font-semibold">{vehicleLabel(v)}</span> <span className="text-mute">{[v.fuel, v.plate, v.vin].filter(Boolean).join(' · ')}</span></li>)}</ul>}</Panel>
          <Panel title="Historique des demandes et interventions">{bs.length === 0 ? <Empty>Aucune demande.</Empty> : <ul className="divide-y divide-graphite/10">{bs.map((b) => <li key={b.id} className="flex flex-wrap items-center gap-3 py-2"><Link href={`/admin/demandes/${b.id}`} className="font-mono link-u">{b.reference}</Link><span className="flex-1">{b.serviceSlugs.map(sname).join(', ')}</span><BookingBadge status={b.status} /><span className="text-[0.875rem] text-mute">{dt.format(b.scheduledStart ?? b.createdAt)}</span></li>)}</ul>}</Panel>
          <Panel title="Devis">{qs.length === 0 ? <Empty>Aucun devis.</Empty> : <ul className="divide-y divide-graphite/10">{qs.map((q) => <li key={q.id} className="flex flex-wrap items-center gap-3 py-2"><Link href={`/admin/devis/${q.id}`} className="font-mono link-u">{q.number}</Link><span className="flex-1">{q.title}</span><QuoteBadge status={q.status} /><span className="tabular-nums">{euros(q.totalTtcCents, { decimals: true })}</span></li>)}</ul>}</Panel>
          {!c.anonymizedAt && (
            <Panel title="Données personnelles (RGPD)">
              <p className="text-[0.9375rem] text-mute">Sur demande du client : <a className="link-u" href={`/api/admin/customers/${c.id}/export`}>exporter ses données (JSON)</a>, ou anonymiser la fiche (suppression des photos, de l’adresse, des plaques et des notes ; les montants des devis sont conservés pour la comptabilité).</p>
              <ActionForm action={anonymizeCustomer} submitLabel="Anonymiser ce client" submitClass="btn btn-sm mt-3 border border-danger/50 text-danger" confirm="Anonymiser définitivement ce client ?"><input type="hidden" name="id" value={c.id} /></ActionForm>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
