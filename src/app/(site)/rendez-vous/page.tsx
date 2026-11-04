import type { Metadata } from 'next';
import { BookingWizard } from '@/components/booking/BookingWizard';
import type { WizardConfig } from '@/components/booking/types';
import { getSite } from '@/lib/site';
import { listServices } from '@/modules/settings/repo';
import { MAKES, FUELS } from '@/modules/vehicles/catalog';
import { DEMO_PLATES } from '@/modules/plates/providers';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Prendre rendez-vous',
  description: 'Demandez une intervention de mécanique à domicile en deux minutes : véhicule, prestation, adresse et disponibilités. Sans création de compte.',
  alternates: { canonical: '/rendez-vous' },
};

export default async function BookingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [site, services] = await Promise.all([getSite(), listServices()]);
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  const cfg: WizardConfig = {
    services: services.map((s) => ({
      slug: s.slug, name: s.name, category: s.category, shortDescription: s.shortDescription, includes: s.includes, requirements: s.requirements,
      infoNeeded: s.infoNeeded, laborPriceCents: s.laborPriceCents, priceValidated: s.priceValidated, priceNote: s.priceNote, isDiagnostic: s.isDiagnostic, durationMinutes: s.durationMinutes,
    })),
    makes: Object.fromEntries(Object.entries(MAKES).map(([k, v]) => [k, v.map(([m]) => m)])),
    fuels: FUELS,
    demo: site.demo,
    demoPlates: env.plateProvider === 'demo' ? Object.keys(DEMO_PLATES) : [],
    demoPrices: site.pricing.demoPrices,
    estimateDisclaimer: site.pricing.estimateDisclaimer,
    phone: site.business.phone,
    phoneHref: site.phoneHref,
    maxKm: site.zone.maxKm,
    baseName: site.zone.baseName,
  };
  const requested = one(sp.service).split(',').filter(Boolean);
  return (
    <section className="bg-paper">
      <div className="container-x py-12 sm:py-16">
        <div className="mx-auto mb-10 max-w-3xl">
          <p className="eyebrow flex items-center gap-3 text-champagne-ink"><span className="h-px w-8 bg-champagne" aria-hidden="true" />Demande de rendez-vous</p>
          <h1 className="mt-4 text-h1 font-light wide">Prendre rendez-vous</h1>
          <p className="mt-4 text-lead text-mute">{site.content.bookingIntro} Aucun compte à créer.</p>
        </div>
        <BookingWizard cfg={cfg} initial={{ services: requested, unknownIssue: one(sp.panne) === 'inconnue' }} />
      </div>
    </section>
  );
}
