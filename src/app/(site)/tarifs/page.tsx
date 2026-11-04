import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/ui/Section';
import { Notice } from '@/components/ui/Field';
import { listServices, getSettings } from '@/modules/settings/repo';
import { euros } from '@/lib/text';

export const metadata: Metadata = { title: 'Tarifs et devis', description: 'Tarifs indicatifs de main-d’œuvre, frais de déplacement et fonctionnement des devis VALFRAN, mécanique automobile à domicile.', alternates: { canonical: '/tarifs' } };

export default async function TarifsPage() {
  const [services, s] = await Promise.all([listServices(), getSettings()]);
  return (
    <>
      <PageHero eyebrow="Tarifs et devis" title="Des prix annoncés, un devis validé par vous." intro="Les montants ci-dessous sont indicatifs. Le prix définitif figure sur le devis, que vous acceptez avant toute intervention." />
      <section className="bg-paper">
        <div className="container-x grid gap-14 py-16 lg:grid-cols-[1.5fr_1fr] lg:py-24">
          <div>
            {s.pricing.demoPrices && <div className="mb-8"><Notice tone="demo" title="Tarifs de démonstration">Ces montants illustrent le fonctionnement du site. Ils doivent être définis et validés par VALFRAN dans l’administration.</Notice></div>}
            <h2 className="text-h3 font-medium">Prestations</h2>
            <table className="mt-6 w-full border-collapse text-left">
              <caption className="sr-only">Tarifs indicatifs par prestation</caption>
              <thead><tr className="border-b border-graphite/20 text-[0.9375rem] text-mute"><th scope="col" className="py-3 font-medium">Prestation</th><th scope="col" className="py-3 text-right font-medium">Tarif indicatif</th></tr></thead>
              <tbody>
                {services.map((x) => (
                  <tr key={x.slug} className="border-b border-graphite/10 align-top">
                    <th scope="row" className="py-4 pr-4 font-normal"><Link className="font-medium link-u" href={`/services/${x.slug}`}>{x.name}</Link><span className="block text-[0.9375rem] text-mute">{x.priceNote}</span></th>
                    <td className="whitespace-nowrap py-4 text-right font-semibold">{x.priceValidated && x.laborPriceCents !== null ? `dès ${euros(x.laborPriceCents)}` : 'Sur devis'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-[0.9375rem] text-mute">{s.pricing.vatMode === 'franchise' ? 'TVA non applicable, article 293 B du CGI (si l’entreprise relève de la franchise en base).' : `Prix TTC, TVA ${s.pricing.vatRate} % incluse.`} Taux horaire de main-d’œuvre : {euros(s.pricing.hourlyRateCents)}.</p>
          </div>
          <aside className="space-y-10">
            <div>
              <h2 className="text-h3 font-medium">Déplacement</h2>
              <ul className="mt-4 divide-y divide-graphite/10 border-y border-graphite/10">
                {s.zone.tiers.map((t, i) => <li key={i} className="flex justify-between py-3"><span>{i === 0 ? `Jusqu’à ${t.upToKm} km` : `${s.zone.tiers[i - 1].upToKm} – ${t.upToKm} km`}</span><span className="font-semibold">{t.feeCents === 0 ? 'Offert' : euros(t.feeCents)}</span></li>)}
              </ul>
            </div>
            <div>
              <h2 className="text-h3 font-medium">Estimation, devis, facture</h2>
              <dl className="mt-4 space-y-4">
                <div><dt className="font-semibold">Estimation</dt><dd className="text-mute">Montant indicatif affiché en ligne, calculé à partir de nos tarifs. Elle n’engage ni vous, ni nous.</dd></div>
                <div><dt className="font-semibold">Devis</dt><dd className="text-mute">Document détaillé (pièces, main-d’œuvre, déplacement) établi pour votre véhicule. Il devient ferme lorsque vous l’acceptez.</dd></div>
                <div><dt className="font-semibold">Facture</dt><dd className="text-mute">Remise après l’intervention, conforme au devis accepté.</dd></div>
              </dl>
            </div>
            <Link href="/rendez-vous" className="btn btn-dark">Demander un devis</Link>
          </aside>
        </div>
      </section>
    </>
  );
}
