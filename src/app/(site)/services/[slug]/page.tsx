import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Phone } from 'lucide-react';
import { PageHero, Breadcrumbs } from '@/components/ui/Section';
import { JsonLd } from '@/components/layout/JsonLd';
import { getServiceBySlug, listServices, listCommunes } from '@/modules/settings/repo';
import { getSite } from '@/lib/site';
import { euros } from '@/lib/text';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = await getServiceBySlug((await params).slug);
  if (!s) return { title: 'Prestation introuvable' };
  return { title: { absolute: s.seoTitle || `${s.name} à domicile — VALFRAN` }, description: s.seoDescription || s.shortDescription, alternates: { canonical: `/services/${s.slug}` }, openGraph: { title: s.seoTitle || s.name, description: s.seoDescription } };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [s, site, all, communes] = await Promise.all([getServiceBySlug(slug), getSite(), listServices(), listCommunes()]);
  if (!s) notFound();
  const others = all.filter((x) => x.slug !== s.slug && x.category === s.category).concat(all.filter((x) => x.slug !== s.slug && x.category !== s.category)).slice(0, 3);
  const hasPrice = s.priceValidated && s.laborPriceCents !== null;
  return (
    <>
      <PageHero eyebrow={s.category} title={`${s.name} à domicile`} intro={s.description}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={`/rendez-vous?service=${s.slug}`} className="btn btn-accent">Demander cette intervention <ArrowRight className="size-5" aria-hidden="true" /></Link>
          <a href={site.phoneHref} className="btn btn-outline-light"><Phone className="size-5" aria-hidden="true" /> {site.business.phone}</a>
        </div>
      </PageHero>
      <section className="bg-paper">
        <div className="container-x grid gap-14 py-16 lg:grid-cols-[1.5fr_1fr] lg:py-24">
          <div className="space-y-12">
            <Breadcrumbs items={[{ href: '/', label: 'Accueil' }, { href: '/services', label: 'Services' }, { label: s.name }]} />
            {s.includes.length > 0 && (
              <div>
                <h2 className="text-h3 font-medium">Ce que comprend l’intervention</h2>
                <ul className="mt-5 space-y-3">{s.includes.map((i) => <li key={i} className="flex gap-3"><Check className="mt-1 size-5 shrink-0 text-ok" aria-hidden="true" />{i}</li>)}</ul>
              </div>
            )}
            {s.requirements.length > 0 && (
              <div>
                <h2 className="text-h3 font-medium">Conditions sur place</h2>
                <ul className="mt-5 space-y-3 text-graphite/85">{s.requirements.map((i) => <li key={i} className="flex gap-3"><span className="mt-3 h-px w-3 shrink-0 bg-champagne" aria-hidden="true" />{i}</li>)}</ul>
              </div>
            )}
            {s.infoNeeded.length > 0 && (
              <div>
                <h2 className="text-h3 font-medium">À préparer pour la demande</h2>
                <ul className="mt-5 space-y-3 text-graphite/85">{s.infoNeeded.map((i) => <li key={i} className="flex gap-3"><span className="mt-3 h-px w-3 shrink-0 bg-champagne" aria-hidden="true" />{i}</li>)}</ul>
              </div>
            )}
            <div>
              <h2 className="text-h3 font-medium">Où intervenons-nous ?</h2>
              <p className="mt-4 text-mute">
                {s.name} à domicile à {communes.filter((c) => c.featured).map((c, i, arr) => (
                  <span key={c.slug}><Link className="link-u text-graphite" href={`/zones-intervention/${c.slug}`}>{c.name}</Link>{i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ' et ' : ''}</span>
                ))}, ainsi que dans les communes environnantes des Vosges et de la Haute-Saône.
              </p>
            </div>
          </div>
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="card p-7">
              <p className="text-mute">Tarif</p>
              <p className="mt-2 text-[2rem] font-light wide">{hasPrice ? `Dès ${euros(s.laborPriceCents)}` : 'Sur devis'}</p>
              <p className="mt-2 text-[0.9375rem] text-mute">{s.priceNote}</p>
              {hasPrice && site.pricing.demoPrices && <p className="mt-2 text-[0.875rem] text-champagne-ink">Tarif de démonstration, à valider.</p>}
              <p className="mt-4 text-[0.9375rem] text-mute">Durée indicative : environ {s.durationMinutes >= 120 ? `${Math.round(s.durationMinutes / 60)} h` : `${s.durationMinutes} min`}.</p>
              <Link href={`/rendez-vous?service=${s.slug}`} className="btn btn-dark mt-6 w-full">Demander un rendez-vous</Link>
              <Link href="/tarifs" className="mt-3 inline-flex min-h-[44px] items-center text-[0.9375rem] link-u">Comment sont établis nos prix</Link>
            </div>
          </aside>
        </div>
      </section>
      <section className="bg-white">
        <div className="container-x py-16">
          <h2 className="text-h3 font-medium">Autres prestations</h2>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-sm border border-graphite/10 bg-graphite/10 md:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug} className="bg-white"><Link href={`/services/${o.slug}`} className="flex h-full flex-col p-6 hover:bg-paper"><span className="text-[1.1875rem] font-medium">{o.name}</span><span className="mt-1 text-mute">{o.shortDescription}</span></Link></li>
            ))}
          </ul>
        </div>
      </section>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'Service', name: `${s.name} à domicile`, serviceType: s.name, description: s.description,
        provider: { '@type': 'AutoRepair', name: site.business.name, url: site.siteUrl },
        areaServed: communes.filter((c) => c.status !== 'excluded').map((c) => c.name),
        url: `${site.siteUrl}/services/${s.slug}`,
      }} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: site.siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Services', item: `${site.siteUrl}/services` },
        { '@type': 'ListItem', position: 3, name: s.name, item: `${site.siteUrl}/services/${s.slug}` },
      ] }} />
    </>
  );
}
