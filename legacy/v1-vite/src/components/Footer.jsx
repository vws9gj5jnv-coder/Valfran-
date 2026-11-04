import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo';
import { BUSINESS } from '../data/business';
import { NAV } from './Header';

export default function Footer() {
  return (
    <footer className="border-t border-ink-600 bg-ink-900/60">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Logo showTagline={false} />
          <p className="mt-4 text-sm leading-relaxed text-chrome-400">{BUSINESS.tagline}. Intervention rapide, tarifs transparents, en {BUSINESS.zone}.</p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chrome-300">Navigation</h3>
          <ul className="space-y-2.5 text-sm">
            {NAV.map((n) => <li key={n.to}><Link className="text-chrome-400 transition hover:text-ember-400" to={n.to}>{n.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chrome-300">Horaires</h3>
          <ul className="space-y-2.5 text-sm text-chrome-400">
            {BUSINESS.hours.map((h) => (
              <li key={h.days} className="flex items-start gap-2"><Clock size={15} className="mt-0.5 shrink-0 text-volt-400" /><span><span className="text-chrome-200">{h.days}</span><br />{h.time}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chrome-300">Contact</h3>
          <ul className="space-y-2.5 text-sm text-chrome-400">
            <li><a className="flex items-center gap-2 hover:text-ember-400" href={BUSINESS.phoneHref}><Phone size={15} className="text-volt-400" />{BUSINESS.phone}</a></li>
            <li><a className="flex items-center gap-2 break-all hover:text-ember-400" href={`mailto:${BUSINESS.email}`}><Mail size={15} className="shrink-0 text-volt-400" />{BUSINESS.email}</a></li>
            <li className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-volt-400" />Zone d'intervention : {BUSINESS.zone}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-600">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-chrome-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {BUSINESS.name}. Tous droits réservés.</p>
          <p className="flex gap-5">
            <Link className="hover:text-chrome-200" to="/mentions-legales">Mentions légales</Link>
            <Link className="hover:text-chrome-200" to="/confidentialite">Politique de confidentialité</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
