import { Link } from 'react-router-dom';
import { ArrowRight, Quote } from 'lucide-react';
import Icon from './Icon';
import Reveal from './Reveal';
import SectionHead from './SectionHead';
import Stars from './Stars';
import { ADVANTAGES, REVIEWS, TRUST } from '../data/content';

export function Advantages() {
  return (
    <section className="section" aria-labelledby="adv">
      <div className="container-x">
        <SectionHead eyebrow="Le concept" title={<span id="adv">Le garage vient à vous</span>}
          text="Fini les journées perdues en atelier. Une intervention professionnelle, directement sur votre parking." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.08}>
              <div className="card card-hover h-full p-6">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-volt-500/15 text-volt-400"><Icon name={a.icon} size={24} /></span>
                <h3 className="mt-5 text-lg font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-chrome-400">{a.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustBadges({ compact = false }) {
  return (
    <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
      {TRUST.map((t, i) => (
        <Reveal key={t.title} delay={i * 0.06}>
          <div className="flex h-full gap-4 rounded-2xl border border-ink-600 bg-ink-800/60 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ember-500/15 text-ember-400"><Icon name={t.icon} size={22} /></span>
            <div>
              <div className="font-semibold text-chrome-100">{t.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-chrome-400">{t.text}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function Reviews() {
  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);
  return (
    <section className="section" aria-labelledby="rev">
      <div className="container-x">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow="Avis clients" title={<span id="rev">Ils m'ont fait confiance</span>} />
          <div className="mb-10 flex items-center gap-4 sm:mb-14">
            <span className="font-display text-5xl font-bold text-chrome-100">{avg}</span>
            <div><Stars value={Math.round(avg)} size={20} /><div className="mt-1 text-xs text-chrome-400">sur {REVIEWS.length} avis</div></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {REVIEWS.map((r, i) => (
            <Reveal key={r.name} delay={(i % 2) * 0.08}>
              <figure className="card card-hover relative h-full p-6">
                <Quote className="absolute right-5 top-5 text-ink-500" size={32} />
                <Stars value={r.rating} />
                <blockquote className="mt-4 text-sm leading-relaxed text-chrome-200 sm:text-base">« {r.text} »</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-volt-500 to-volt-600 font-semibold text-white">{r.name[0]}</span>
                  <span className="text-sm"><span className="block font-medium text-chrome-100">{r.name} · {r.city}</span><span className="text-chrome-500">{r.service} · {r.date}</span></span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-xs text-chrome-500">Avis de démonstration — à remplacer par vos véritables témoignages clients.</p>
      </div>
    </section>
  );
}

export function CtaBand({ title = 'Prêt à gagner du temps ?', text = 'Obtenez votre estimation en 60 secondes et réservez un créneau.', to = '/garage-virtuel', label = 'Ouvrir le Garage Virtuel' }) {
  return (
    <section className="pb-20">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-ink-500 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900 p-8 sm:p-14">
            <div className="grid-bg absolute inset-0 opacity-60" />
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-ember-500/20 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-xl"><h2 className="text-3xl font-bold sm:text-4xl">{title}</h2><p className="lead mt-3">{text}</p></div>
              <Link to={to} className="btn-primary !px-7 !py-4 text-base">{label} <ArrowRight size={18} /></Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
