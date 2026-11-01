import { useMeta } from '../hooks/useMeta';
import SectionHead from '../components/SectionHead';
import Reveal from '../components/Reveal';
import { CtaBand, Reviews, TrustBadges } from '../components/Sections';

const VALUES = [
  ['Rigueur', 'Chaque intervention suit les préconisations constructeur, avec des pièces de qualité équivalente OE.'],
  ['Transparence', 'Prix annoncé avant les travaux, pièces montrées, facture détaillée. Zéro surprise.'],
  ['Proximité', 'Un interlocuteur unique, joignable directement, qui connaît votre véhicule.'],
];

export default function About() {
  useMeta('À propos — Valfran Mécanique', 'Valfran Mécanique : un mécanicien qualifié au service des particuliers en Haute-Saône et dans les Vosges.');
  return (
    <>
      <section className="pb-8 pt-28 sm:pt-36">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHead as="h1" eyebrow="À propos" title="La rigueur d'un atelier, la souplesse du sur-mesure" />
            <Reveal><p className="lead -mt-6">Valfran Mécanique est née d'un constat simple : entretenir sa voiture ne devrait pas coûter une demi-journée. Mécanicien qualifié, j'ai conçu un atelier mobile complet pour intervenir là où vous êtes, avec le même niveau d'exigence qu'en garage.</p></Reveal>
            <Reveal delay={0.1}><p className="lead mt-4">En parallèle, je sélectionne et remets en état des véhicules d'occasion : chacun est contrôlé, révisé et garanti, avec un historique clair.</p></Reveal>
            <p className="mt-4 text-xs text-chrome-500">Texte de présentation à personnaliser (parcours, diplômes, années d'expérience, photo).</p>
          </div>
          <div className="grid gap-4">
            {VALUES.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.08}>
                <div className="card card-hover flex gap-5 p-6">
                  <span className="font-display text-4xl font-bold text-ink-500">0{i + 1}</span>
                  <div><h3 className="text-lg font-semibold">{t}</h3><p className="mt-1 text-sm leading-relaxed text-chrome-400">{d}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section"><div className="container-x"><TrustBadges /></div></section>
      <Reviews />
      <CtaBand />
    </>
  );
}
