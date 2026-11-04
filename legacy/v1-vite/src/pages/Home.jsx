import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Star } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import GarageVirtuel from '../garage/GarageVirtuel';
import Reveal from '../components/Reveal';
import SectionHead from '../components/SectionHead';
import Icon from '../components/Icon';
import VehicleCard from '../components/VehicleCard';
import { Advantages, CtaBand, Reviews, TrustBadges } from '../components/Sections';
import { SERVICES } from '../data/services';
import { VEHICLES } from '../data/vehicles';
import { BUSINESS } from '../data/business';

export default function Home() {
  useMeta('Valfran Mécanique — Mécanique à domicile en Haute-Saône & Vosges', 'Mécanicien à domicile en Haute-Saône et dans les Vosges : devis instantané avec votre plaque, RDV en ligne, véhicules d\'occasion révisés et garantis.');
  return (
    <>
      <section className="relative overflow-hidden pt-28 sm:pt-36">
        <div className="grid-bg absolute inset-x-0 top-0 h-[700px] opacity-70" aria-hidden="true" />
        <div className="container-x relative grid items-start gap-12 pb-16 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-10 lg:pb-24">
          <div className="pt-2 lg:pt-10">
            <Reveal><span className="chip !border-ember-500/40 !text-ember-400"><BadgeCheck size={14} /> Mécanicien qualifié · Haute-Saône &amp; Vosges</span></Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 text-4xl font-bold leading-[1.04] sm:text-6xl xl:text-7xl">
                <span className="chrome-text">Votre garage,</span><br />
                <span className="text-ember-500">devant chez vous.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}><p className="lead mt-6 max-w-lg">Entretien, freinage, distribution, diagnostic… Entrez votre plaque, obtenez un prix en 60 secondes et réservez votre créneau. Je me déplace à domicile ou sur votre lieu de travail.</p></Reveal>
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/mecanique" className="btn-ghost">Voir les tarifs</Link>
                <Link to="/vehicules" className="btn-ghost">Véhicules d'occasion <ArrowRight size={16} /></Link>
              </div>
            </Reveal>
            <Reveal delay={0.32}>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-ink-600 pt-6">
                {[['60 s', 'pour un devis'], ['75 km', 'autour de Vesoul'], ['6 j/7', 'sur rendez-vous']].map(([n, l]) => (
                  <div key={l}><dt className="font-display text-2xl font-bold text-chrome-100 sm:text-3xl">{n}</dt><dd className="mt-1 text-xs text-chrome-500">{l}</dd></div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={0.2} y={32}>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-chrome-400">
              <Star size={14} className="fill-ember-500 text-ember-500" /> Le Garage Virtuel Valfran
            </div>
            <GarageVirtuel id="garage-home" />
          </Reveal>
        </div>
      </section>

      <Advantages />

      <section className="section border-y border-ink-600 bg-ink-900/50" aria-labelledby="svc">
        <div className="container-x">
          <SectionHead eyebrow="Interventions" title={<span id="svc">Toute la mécanique courante, sur place</span>} text={`Tarif horaire ${BUSINESS.hourlyRate} € TTC, pièces au prix juste, déplacement dégressif.`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 0.07}>
                <Link to="/garage-virtuel" className="card card-hover group flex h-full gap-4 p-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-600 text-volt-400 transition group-hover:bg-ember-500 group-hover:text-ink-950"><Icon name={s.icon} size={22} /></span>
                  <span><span className="block font-semibold text-chrome-100">{s.label}</span><span className="mt-1 block text-sm leading-relaxed text-chrome-400">{s.desc}</span></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="occ">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead eyebrow="Occasions" title={<span id="occ">Véhicules révisés &amp; garantis</span>} text="Chaque voiture est contrôlée point par point avant la vente." />
            <Link to="/vehicules" className="btn-ghost mb-10 sm:mb-14">Tout le showroom <ArrowRight size={16} /></Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {VEHICLES.slice(0, 3).map((v, i) => <Reveal key={v.id} delay={i * 0.08}><VehicleCard v={v} /></Reveal>)}
          </div>
        </div>
      </section>

      <section className="pb-8"><div className="container-x"><TrustBadges /></div></section>
      <Reviews />
      <CtaBand />
    </>
  );
}
