import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/ui/Section';
import { getSite } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Comment ça marche',
  description: 'Demande en ligne, confirmation par téléphone, intervention à domicile : le fonctionnement de VALFRAN, mécanique automobile à domicile, en trois étapes.',
  alternates: { canonical: '/comment-ca-marche' },
};

export default async function HowPage() {
  const site = await getSite();
  const steps = [
    { t: 'Vous faites votre demande', d: 'En ligne en deux minutes ou par téléphone. Indiquez votre véhicule (la plaque suffit), l’intervention souhaitée, l’adresse et vos disponibilités. Vous recevez immédiatement une référence.', more: ['Aucun compte à créer', 'Photos facultatives', 'Option « Je ne sais pas quelle est la panne »'] },
    { t: 'Nous confirmons ensemble', d: 'Nous étudions la demande et vous contactons pour confirmer la faisabilité sur place, la date, l’heure et le montant. Un devis est établi lorsque c’est nécessaire.', more: ['Rien n’est engagé sans votre accord', 'Devis écrit si nécessaire', 'Conditions sur place précisées'] },
    { t: 'L’atelier vient à vous', d: 'Le jour convenu, nous intervenons à votre domicile, sur votre lieu de travail ou à l’endroit prévu. Nous vous expliquons ce qui a été fait et pourquoi.', more: ['Pièces usagées présentées sur demande', 'Huiles et déchets récupérés', 'Facture remise après intervention'] },
  ];
  return (
    <>
      <PageHero eyebrow="Comment ça marche" title="Trois étapes, sans vous déplacer." intro="Une organisation simple, pensée pour vous faire gagner du temps sans rien laisser au hasard." />
      <section className="bg-paper">
        <ol className="container-x py-16 lg:py-24">
          {steps.map((s, i) => (
            <li key={s.t} className="grid gap-6 border-t border-graphite/10 py-12 first:border-t-0 first:pt-0 lg:grid-cols-[8rem_1.3fr_1fr] lg:gap-12">
              <span className="text-[3rem] font-extralight leading-none text-champagne-ink tabular-nums" style={{ fontStretch: '120%' }}>0{i + 1}</span>
              <div><h2 className="text-h2 font-light wide">{s.t}</h2><p className="mt-4 text-lead text-mute">{s.d}</p></div>
              <ul className="space-y-3 self-end">{s.more.map((m) => <li key={m} className="flex gap-3"><span className="mt-3 h-px w-4 shrink-0 bg-champagne" aria-hidden="true" />{m}</li>)}</ul>
            </li>
          ))}
        </ol>
      </section>
      <section className="on-dark bg-graphite text-paper">
        <div className="container-x flex flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center">
          <p className="text-h3 font-light wide">Prêt ? Comptez environ deux minutes.</p>
          <div className="flex flex-col gap-3 sm:flex-row"><Link href="/rendez-vous" className="btn btn-accent">Prendre rendez-vous <ArrowRight className="size-5" aria-hidden="true" /></Link><a className="btn btn-outline-light" href={site.phoneHref}>{site.business.phone}</a></div>
        </div>
      </section>
    </>
  );
}
