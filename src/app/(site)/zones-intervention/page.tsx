import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/ui/Section';
import { ZoneMap } from '@/components/home/ZoneMap';
import { CommuneSearch } from '@/components/home/CommuneSearch';
import { listCommunes, getSettings } from '@/modules/settings/repo';
import { computeCoverage } from '@/modules/zones/coverage';
import { euros } from '@/lib/text';

export const metadata: Metadata = {
  title: 'Zones d’intervention — Vosges et Haute-Saône',
  description: 'Communes desservies par VALFRAN, mécanique automobile à domicile : Rupt-sur-Moselle, Remiremont, Le Thillot, Le Val-d’Ajol, Plombières-les-Bains, Luxeuil-les-Bains, Lure et alentours.',
  alternates: { canonical: '/zones-intervention' },
};

export default async function ZonesPage() {
  const [communes, settings] = await Promise.all([listCommunes(), getSettings()]);
  const z = settings.zone;
  const rows = communes.filter((c) => c.status !== 'excluded').map((c) => ({ c, cov: computeCoverage(c, z, c) })).sort((a, b) => a.cov.distanceKm - b.cov.distanceKm);
  const byDept = (d: string) => rows.filter((r) => r.c.department === d);
  return (
    <>
      <PageHero eyebrow="Zones d’intervention" title="Des Vosges à la Haute-Saône." intro={`Au départ de ${z.baseName}, dans un rayon d’environ ${z.maxKm} km par la route. Votre commune n’apparaît pas ? Faites tout de même votre demande : nous étudions chaque cas.`} />
      <section className="bg-paper">
        <div className="container-x grid gap-12 py-16 lg:grid-cols-[1fr_1.1fr] lg:py-24">
          <div className="space-y-10">
            <CommuneSearch />
            <div>
              <h2 className="text-h3 font-medium">Frais de déplacement</h2>
              <ul className="mt-4 divide-y divide-graphite/10 border-y border-graphite/10">
                {z.tiers.map((t, i) => (
                  <li key={i} className="flex justify-between py-3"><span>{i === 0 ? `Jusqu’à ${t.upToKm} km` : `De ${z.tiers[i - 1].upToKm} à ${t.upToKm} km`}</span><span className="font-semibold">{t.feeCents === 0 ? 'Offert' : euros(t.feeCents)}</span></li>
                ))}
                <li className="flex justify-between py-3"><span>Au-delà</span><span className="font-semibold">Sur demande</span></li>
              </ul>
              <p className="mt-3 text-[0.9375rem] text-mute">Distances routières estimées.{settings.pricing.demoPrices ? ' Tarifs de démonstration.' : ''}</p>
            </div>
          </div>
          <ZoneMap communes={communes} base={{ lat: z.baseLat, lon: z.baseLon, name: z.baseName }} />
        </div>
        <div className="container-x grid gap-12 pb-24 md:grid-cols-2">
          {[['88', 'Vosges (88)'], ['70', 'Haute-Saône (70)']].map(([d, label]) => (
            <div key={d}>
              <h2 className="eyebrow text-champagne-ink">{label}</h2>
              <ul className="mt-4 divide-y divide-graphite/10 border-y border-graphite/10">
                {byDept(d).map(({ c, cov }) => (
                  <li key={c.slug} className="flex min-h-[52px] items-center justify-between gap-4">
                    {c.featured ? <Link href={`/zones-intervention/${c.slug}`} className="link-u font-medium">{c.name}</Link> : <span>{c.name}</span>}
                    <span className="text-[0.9375rem] text-mute">{c.postcode} · ~{cov.distanceKm} km</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
