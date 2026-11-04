import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, MapPin, Route, Timer } from 'lucide-react';
import { PageHero, Breadcrumbs } from '@/components/ui/Section';
import { JsonLd } from '@/components/layout/JsonLd';
import { getCommuneBySlug, listCommunes, listServices } from '@/modules/settings/repo';
import { computeCoverage, haversineKm } from '@/modules/zones/coverage';
import { getSite } from '@/lib/site';
import { euros } from '@/lib/text';

export async function generateMetadata({ params }: { params: Promise<{ commune: string }> }): Promise<Metadata> {
  const c = await getCommuneBySlug((await params).commune);
  if (!c || !c.featured) return { title: 'Commune introuvable' };
  return {
    title: { absolute: `Mécanicien à domicile à ${c.name} (${c.postcode}) — VALFRAN` },
    description: `Entretien, diagnostic, freinage, pneus et réparations automobiles à domicile à ${c.name} et alentours. Frais de déplacement et demande de rendez-vous en ligne.`,
    alternates: { canonical: `/zones-intervention/${c.slug}` },
  };
}

export default async function CommunePage({ params }: { params: Promise<{ commune: string }> }) {
  const slug = (await params).commune;
  const [c, all, services, site] = await Promise.all([getCommuneBySlug(slug), listCommunes(), listServices(), getSite()]);
  if (!c || !c.featured || c.status === 'excluded') notFound();
  const cov = computeCoverage(c, site.zone, c);
  const nearby = all.filter((x) => x.slug !== c.slug && x.status !== 'excluded').map((x) => ({ x, d: haversineKm(c, x) })).sort((a, b) => a.d - b.d).slice(0, 8);
  const dept = c.department === '88' ? 'Vosges' : 'Haute-Saône';
  return (
    <>
      <PageHero eyebrow={`${dept} (${c.department})`} title={`Mécanicien à domicile à ${c.name}`} intro={c.localIntro || `VALFRAN intervient à ${c.name} et dans les communes voisines pour l’entretien, le diagnostic et les réparations compatibles avec une intervention mobile : devant chez vous, sur votre lieu de travail ou sur un parking adapté.`}>
        <Link href="/rendez-vous" className="btn btn-accent">Prendre rendez-vous à {c.name} <ArrowRight className="size-5" aria-hidden="true" /></Link>
      </PageHero>
      <section className="bg-paper">
        <div className="container-x py-16 lg:py-20">
          <Breadcrumbs items={[{ href: '/', label: 'Accueil' }, { href: '/zones-intervention', label: 'Zones' }, { label: c.name }]} />
          <ul className="mt-8 grid gap-px overflow-hidden rounded-sm border border-graphite/10 bg-graphite/10 sm:grid-cols-3">
            <li className="bg-white p-6"><Route className="size-6" strokeWidth={1.5} aria-hidden="true" /><p className="mt-4 text-mute">Distance depuis {site.zone.baseName}</p><p className="text-[1.5rem] font-light wide">{cov.distanceKm === 0 ? 'Sur place' : `≈ ${cov.distanceKm} km`}</p></li>
            <li className="bg-white p-6"><Timer className="size-6" strokeWidth={1.5} aria-hidden="true" /><p className="mt-4 text-mute">Trajet estimé</p><p className="text-[1.5rem] font-light wide">≈ {cov.travelMinutes} min</p></li>
            <li className="bg-white p-6"><MapPin className="size-6" strokeWidth={1.5} aria-hidden="true" /><p className="mt-4 text-mute">Frais de déplacement</p><p className="text-[1.5rem] font-light wide">{cov.status !== 'served' || cov.feeCents === null ? 'Sur demande' : cov.feeCents === 0 ? 'Offerts' : euros(cov.feeCents)}</p>{site.pricing.demoPrices && <p className="text-[0.8125rem] text-champagne-ink">Tarif de démonstration</p>}</li>
          </ul>
          <div className="mt-16 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h2 className="text-h3 font-medium">Interventions possibles à {c.name}</h2>
              <ul className="mt-6 divide-y divide-graphite/10 border-y border-graphite/10">
                {services.map((s) => (
                  <li key={s.slug}><Link href={`/services/${s.slug}`} className="flex min-h-[60px] items-center justify-between gap-4 hover:text-champagne-ink"><span><span className="font-medium">{s.name}</span><span className="hidden text-mute md:inline"> — {s.shortDescription}</span></span><ArrowRight className="size-4 shrink-0" aria-hidden="true" /></Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-h3 font-medium">Communes voisines</h2>
              <ul className="mt-6 flex flex-wrap gap-2">
                {nearby.map(({ x }) => (
                  <li key={x.slug}>{x.featured ? <Link className="badge min-h-[40px] border border-graphite/20 bg-white px-3 font-medium hover:border-graphite" href={`/zones-intervention/${x.slug}`}>{x.name}</Link> : <span className="badge min-h-[40px] border border-graphite/10 px-3 font-normal text-mute">{x.name}</span>}</li>
                ))}
              </ul>
              <p className="mt-6 text-[0.9375rem] text-mute">Les distances sont des estimations routières. Le montant exact du déplacement est confirmé avec vous avant l’intervention.</p>
            </div>
          </div>
        </div>
      </section>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'AutoRepair', name: site.business.name, url: `${site.siteUrl}/zones-intervention/${c.slug}`, areaServed: { '@type': 'City', name: c.name, address: { '@type': 'PostalAddress', postalCode: c.postcode, addressLocality: c.name, addressCountry: 'FR' } } }} />
    </>
  );
}
