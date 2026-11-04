import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileActionBar } from '@/components/layout/MobileActionBar';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { JsonLd } from '@/components/layout/JsonLd';
import { getSite } from '@/lib/site';
import { listServices, listCommunes } from '@/modules/settings/repo';
import { AnalyticsScript } from '@/modules/analytics/AnalyticsScript';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [site, services, communes] = await Promise.all([getSite(), listServices(), listCommunes()]);
  const b = site.business;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: b.name,
    url: site.siteUrl,
    telephone: b.phoneIsPlaceholder ? undefined : b.phone,
    email: b.email || undefined,
    description: site.content.heroSubtitle,
    address: b.addressLine ? { '@type': 'PostalAddress', streetAddress: b.addressLine, postalCode: b.postcode, addressLocality: b.city, addressCountry: 'FR' } : { '@type': 'PostalAddress', postalCode: b.postcode, addressLocality: b.city, addressCountry: 'FR' },
    areaServed: communes.filter((c) => c.status !== 'excluded').map((c) => ({ '@type': 'City', name: c.name })),
    sameAs: b.googleBusinessUrl ? [b.googleBusinessUrl] : undefined,
    makesOffer: services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: `${site.siteUrl}/services/${s.slug}` } })),
  };
  return (
    <>
      {site.demo && <DemoBanner />}
      <Header phone={b.phone} phoneHref={site.phoneHref} />
      <main id="contenu" className="pb-[88px] sm:pb-0">{children}</main>
      <Footer site={site} services={services} communes={communes} />
      <MobileActionBar phoneHref={site.phoneHref} />
      <JsonLd data={ld} />
      <AnalyticsScript />
    </>
  );
}
