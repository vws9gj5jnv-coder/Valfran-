import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/ui/Section';
import { getSite } from '@/lib/site';

export const metadata: Metadata = { title: 'À propos', description: 'VALFRAN, entreprise indépendante de mécanique automobile à domicile dans les Vosges et en Haute-Saône.', alternates: { canonical: '/a-propos' } };

export default async function AboutPage() {
  const site = await getSite();
  const c = site.content;
  const q = site.business.qualifications;
  return (
    <>
      <PageHero eyebrow="À propos" title={c.aboutTitle} />
      <section className="bg-paper">
        <div className="container-x grid gap-16 py-16 lg:grid-cols-[1.4fr_1fr] lg:py-24">
          <div className="prose-vf max-w-2xl text-lead text-graphite/85">
            {c.aboutText.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <aside className="space-y-10">
            <div>
              <h2 className="eyebrow text-champagne-ink">Valeurs</h2>
              <ul className="mt-5 space-y-4">
                {[['Précision', 'Un diagnostic avant une réparation, une explication avant une facture.'], ['Clarté', 'Un prix annoncé, un devis validé, aucune intervention sans accord.'], ['Proximité', 'Une entreprise locale, joignable directement par téléphone.']].map(([t, d]) => (
                  <li key={t}><p className="font-semibold">{t}</p><p className="text-mute">{d}</p></li>
                ))}
              </ul>
            </div>
            {q.length > 0 && (
              <div>
                <h2 className="eyebrow text-champagne-ink">Qualifications</h2>
                <ul className="mt-5 space-y-2">{q.map((x) => <li key={x} className="flex gap-3"><span className="mt-3 h-px w-3 shrink-0 bg-champagne" aria-hidden="true" />{x}</li>)}</ul>
              </div>
            )}
            {site.demo && (
              <p className="rounded-sm border border-champagne/60 bg-[#f4efe6] p-4 text-[0.9375rem]">Mode démonstration : le texte de présentation et les qualifications vérifiées sont à saisir par VALFRAN dans l’administration. Aucune qualification n’est affichée tant qu’elle n’a pas été renseignée.</p>
            )}
            <Link href="/rendez-vous" className="btn btn-dark">Prendre rendez-vous</Link>
          </aside>
        </div>
      </section>
    </>
  );
}
