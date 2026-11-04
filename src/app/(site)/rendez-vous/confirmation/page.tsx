import type { Metadata } from 'next';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { CheckCircle2, Phone } from 'lucide-react';
import { getDb } from '@/db/client';
import { bookings, vehicles } from '@/db/schema';
import { getSite } from '@/lib/site';
import { listServices } from '@/modules/settings/repo';
import { vehicleLabel } from '@/modules/vehicles/catalog';

export const metadata: Metadata = { title: 'Demande reçue', robots: { index: false, follow: false } };

const fmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ ref?: string; t?: string }> }) {
  const { ref, t } = await searchParams;
  const site = await getSite();
  const db = await getDb();
  const rows = t && t.length < 80 ? await db.select().from(bookings).where(eq(bookings.publicToken, t)) : [];
  const b = rows[0] && rows[0].reference === ref ? rows[0] : null;
  if (!b) {
    return (
      <section className="container-x py-20">
        <h1 className="text-h2 font-light wide">Demande introuvable</h1>
        <p className="mt-4 text-mute">Ce lien n’est pas valide. Si vous venez d’envoyer une demande, elle a bien été enregistrée : nous vous contacterons. En cas de doute, appelez-nous au <a className="link-u" href={site.phoneHref}>{site.business.phone}</a>.</p>
      </section>
    );
  }
  const services = await listServices({ includeInactive: true });
  const v = b.vehicleId ? (await db.select().from(vehicles).where(eq(vehicles.id, b.vehicleId)))[0] : null;
  const names = b.serviceSlugs.map((s) => services.find((x) => x.slug === s)?.name ?? s);
  return (
    <section className="bg-paper">
      <div className="container-x py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <CheckCircle2 className="size-12 text-ok" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="mt-6 text-h1 font-light wide">Demande bien reçue</h1>
          <p className="mt-4 text-lead text-mute">Votre demande est enregistrée. <strong className="text-graphite">Elle n’est pas encore un rendez-vous confirmé</strong> : nous vous contactons pour convenir de l’heure exacte et du montant.</p>
          <div className="mt-10 rounded-sm border border-graphite/15 bg-white">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-graphite/10 px-6 py-5">
              <p className="text-mute">Référence</p>
              <p className="text-[1.5rem] font-semibold tracking-[0.06em] tabular-nums" data-testid="booking-reference">{b.reference}</p>
            </div>
            <dl className="divide-y divide-graphite/10">
              <div className="grid gap-1 px-6 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-mute">Statut</dt><dd>Demande à confirmer</dd></div>
              {v && <div className="grid gap-1 px-6 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-mute">Véhicule</dt><dd>{vehicleLabel(v)}</dd></div>}
              <div className="grid gap-1 px-6 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-mute">Intervention</dt><dd>{names.join(', ')}</dd></div>
              <div className="grid gap-1 px-6 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-mute">Adresse</dt><dd>{b.address}, {b.postcode} {b.city}</dd></div>
              <div className="grid gap-1 px-6 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-mute">Préférences</dt><dd>{b.preferredSlots.length ? <ul>{b.preferredSlots.map((s) => <li key={s} className="first-letter:uppercase">{fmt.format(new Date(s))}</li>)}</ul> : 'À convenir par téléphone'}</dd></div>
            </dl>
          </div>
          <p className="mt-6 text-mute">Notez votre référence : elle vous sera demandée si vous nous appelez.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={site.phoneHref} className="btn btn-dark"><Phone className="size-5" aria-hidden="true" /> {site.business.phone}</a>
            <Link href="/" className="btn btn-outline-dark">Retour à l’accueil</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
