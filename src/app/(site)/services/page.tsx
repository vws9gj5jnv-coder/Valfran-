import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { PageHero } from '@/components/ui/Section';
import { listServices, getSetting } from '@/modules/settings/repo';
import { euros } from '@/lib/text';

export const metadata: Metadata = {
  title: 'Nos services de mécanique à domicile',
  description: 'Entretien, vidange, diagnostic, freinage, pneumatiques, suspension, batterie, distribution : toutes nos interventions de mécanique automobile à domicile dans les Vosges et en Haute-Saône.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const [services, pricing] = await Promise.all([listServices(), getSetting('pricing')]);
  const cats = [...new Set(services.map((s) => s.category))];
  return (
    <>
      <PageHero eyebrow="Nos services" title="Les interventions réalisables chez vous." intro="Chaque prestation est étudiée avant le déplacement. Si une réparation demande un atelier fixe, nous vous le disons clairement." />
      <section className="bg-paper">
        <div className="container-x py-16 lg:py-24">
          {cats.map((cat) => (
            <div key={cat} className="mb-14 last:mb-0">
              <h2 className="eyebrow text-champagne-ink">{cat}</h2>
              <ul className="mt-5 divide-y divide-graphite/10 border-y border-graphite/10">
                {services.filter((s) => s.category === cat).map((s) => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} className="group grid gap-2 py-6 sm:grid-cols-[1.1fr_1.6fr_auto] sm:items-center sm:gap-8">
                      <span className="text-[1.375rem] font-medium">{s.name}</span>
                      <span className="text-mute">{s.shortDescription}</span>
                      <span className="flex items-center gap-4 text-[0.9375rem]">
                        <span>{s.priceValidated && s.laborPriceCents !== null ? `Dès ${euros(s.laborPriceCents)}${pricing.demoPrices ? ' (démo)' : ''}` : 'Sur devis'}</span>
                        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-16 flex flex-col items-start gap-6 rounded-sm bg-graphite p-8 text-paper sm:flex-row sm:items-center sm:justify-between lg:p-10">
            <div className="flex items-start gap-4">
              <HelpCircle className="mt-1 size-7 shrink-0 text-champagne" strokeWidth={1.4} aria-hidden="true" />
              <div><p className="text-[1.375rem] font-medium">Vous ne savez pas ce qu’a votre voiture ?</p><p className="mt-1 text-paper/70">Décrivez ce que vous constatez : nous commençons par un diagnostic.</p></div>
            </div>
            <Link href="/rendez-vous?panne=inconnue" className="btn btn-accent">Demander un diagnostic</Link>
          </div>
        </div>
      </section>
    </>
  );
}
