import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import type { Site } from '@/lib/site';
import type { Service, Commune } from '@/modules/settings/repo';

export function Footer({ site, services, communes }: { site: Site; services: Service[]; communes: Commune[] }) {
  const b = site.business;
  return (
    <footer className="on-dark bg-graphite text-paper">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:py-20">
        <div>
          <Wordmark />
          <p className="mt-6 max-w-sm text-paper/70">
            Mécanique automobile à domicile dans les Vosges et en Haute-Saône.
          </p>
          <p className="mt-6">
            <a href={site.phoneHref} className="text-[1.375rem] font-medium tabular-nums text-paper hover:text-champagne-2">{b.phone}</a>
          </p>
          {b.email && <p className="mt-2"><a className="link-u text-paper/80" href={`mailto:${b.email}`}>{b.email}</a></p>}
          <dl className="mt-6 space-y-1 text-[0.9375rem] text-paper/70">
            {b.hours.map((h) => (
              <div key={h.label} className="flex gap-3"><dt className="min-w-[9.5rem]">{h.label}</dt><dd className="text-paper/90">{h.value}</dd></div>
            ))}
          </dl>
        </div>
        <nav aria-label="Prestations">
          <h2 className="eyebrow text-alu">Prestations</h2>
          <ul className="mt-5 space-y-2.5">
            {services.map((s) => <li key={s.slug}><Link className="text-paper/80 hover:text-paper" href={`/services/${s.slug}`}>{s.name}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Zones d’intervention">
          <h2 className="eyebrow text-alu">Zones</h2>
          <ul className="mt-5 space-y-2.5">
            {communes.filter((c) => c.featured).map((c) => <li key={c.slug}><Link className="text-paper/80 hover:text-paper" href={`/zones-intervention/${c.slug}`}>{c.name}</Link></li>)}
            <li><Link className="text-paper/80 hover:text-paper" href="/zones-intervention">Toutes les communes</Link></li>
          </ul>
        </nav>
        <nav aria-label="Informations">
          <h2 className="eyebrow text-alu">VALFRAN</h2>
          <ul className="mt-5 space-y-2.5">
            {[['/rendez-vous', 'Prendre rendez-vous'], ['/comment-ca-marche', 'Comment ça marche'], ['/tarifs', 'Tarifs et devis'], ['/realisations', 'Réalisations'], ['/a-propos', 'À propos'], ['/faq', 'Questions fréquentes'], ['/contact', 'Contact']].map(([href, label]) => (
              <li key={href}><Link className="text-paper/80 hover:text-paper" href={href}>{label}</Link></li>
            ))}
            {b.googleBusinessUrl && <li><a className="text-paper/80 hover:text-paper" href={b.googleBusinessUrl} rel="noopener" target="_blank">Fiche Google</a></li>}
          </ul>
        </nav>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-x flex flex-col gap-4 py-6 text-[0.875rem] text-paper/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {b.legalName || b.name}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><Link className="hover:text-paper" href="/mentions-legales">Mentions légales</Link></li>
            <li><Link className="hover:text-paper" href="/confidentialite">Confidentialité</Link></li>
            <li><Link className="hover:text-paper" href="/cookies">Cookies</Link></li>
            <li><Link className="hover:text-paper" href="/conditions-generales">Conditions générales</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
