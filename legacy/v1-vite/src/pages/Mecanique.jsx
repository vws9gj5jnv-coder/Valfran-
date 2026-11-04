import { Link } from 'react-router-dom';
import { Plug, Cloud, Wrench, Check } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import SectionHead from '../components/SectionHead';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import Accordion from '../components/Accordion';
import ZoneMap from '../components/ZoneMap';
import { Advantages, CtaBand } from '../components/Sections';
import { SERVICES } from '../data/services';
import { FAQ } from '../data/content';
import { TRAVEL_TIERS } from '../data/zones';
import { BUSINESS } from '../data/business';
import { computeQuote, eur } from '../lib/pricing';

// Véhicule de référence pour afficher des prix "à partir de"
const REF = { category: 'Citadine', fuel: 'Essence' };

export default function Mecanique() {
  useMeta('Mécanique à domicile & tarifs — Valfran Mécanique', 'Découvrez le concept de mécanique à domicile, les tarifs transparents et la zone d\'intervention en Haute-Saône et Vosges.');
  return (
    <>
      <section className="pb-8 pt-28 sm:pt-36">
        <div className="container-x">
          <SectionHead eyebrow="Mécanique & Tarifs" as="h1" title="Mécanique à domicile, tarifs transparents"
            text="Un atelier mobile complet et un mécanicien qualifié, chez vous ou sur votre lieu de travail." />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.filter((s) => !s.quote).map((s, i) => {
              const q = computeQuote({ vehicle: REF, serviceId: s.id });
              return (
                <Reveal key={s.id} delay={(i % 3) * 0.07}>
                  <div className="card card-hover flex h-full flex-col p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-volt-500/15 text-volt-400"><Icon name={s.icon} size={24} /></span>
                      <div className="text-right"><div className="text-[11px] uppercase tracking-wider text-chrome-500">À partir de</div><div className="font-display text-2xl font-bold text-ember-400">{eur(q.subtotal)}</div></div>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{s.label}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-chrome-400">{s.desc}</p>
                    {s.addons.length > 0 && (
                      <ul className="mt-4 space-y-1.5 text-xs text-chrome-400">
                        {s.addons.map((a) => <li key={a.id} className="flex items-center gap-2"><Check size={13} className="text-emerald-400" />{a.label}{a.price > 0 && <span className="ml-auto text-chrome-500">+ {eur(a.price)}</span>}</li>)}
                      </ul>
                    )}
                    <Link to="/garage-virtuel" className="btn-ghost mt-5 w-full">Estimer pour mon véhicule</Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-chrome-500">Prix TTC indicatifs pour une citadine essence, hors déplacement. Le tarif exact dépend de votre véhicule : utilisez le Garage Virtuel.</p>
        </div>
      </section>

      <Advantages />

      <section className="section border-y border-ink-600 bg-ink-900/50" aria-labelledby="zone">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Zone d'intervention</span>
            <h2 id="zone" className="h-section mt-3">Haute-Saône &amp; Vosges</h2>
            <p className="lead mt-4">Je me déplace dans un rayon de 75 km autour de {BUSINESS.base.city}. Touchez une commune sur la carte pour voir le forfait de déplacement.</p>
            <ul className="mt-6 space-y-2">
              {TRAVEL_TIERS.map((t) => (
                <li key={t.max} className="flex items-center justify-between rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-sm">
                  <span className="text-chrome-300">{t.label}</span><span className="font-semibold text-chrome-100">{eur(t.fee)}</span>
                </li>
              ))}
            </ul>
          </div>
          <Reveal><ZoneMap /></Reveal>
        </div>
      </section>

      <section className="section" aria-labelledby="faq">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="eyebrow">FAQ</span>
            <h2 id="faq" className="h-section mt-3">Vos questions, mes réponses</h2>
            <div className="mt-8 space-y-3 text-sm text-chrome-400">
              <p className="flex gap-3"><Plug className="shrink-0 text-volt-400" size={18} /> Autonome en énergie pour la plupart des interventions.</p>
              <p className="flex gap-3"><Cloud className="shrink-0 text-volt-400" size={18} /> Report gratuit en cas de météo défavorable.</p>
              <p className="flex gap-3"><Wrench className="shrink-0 text-volt-400" size={18} /> Atelier mobile et valise de diagnostic multimarque.</p>
            </div>
          </div>
          <Accordion items={FAQ} />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
