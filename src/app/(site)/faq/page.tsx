import type { Metadata } from 'next';
import { PageHero } from '@/components/ui/Section';
import { JsonLd } from '@/components/layout/JsonLd';
import { listFaqs } from '@/modules/settings/repo';

export const metadata: Metadata = { title: 'Questions fréquentes', description: 'Réponses simples aux questions sur la mécanique automobile à domicile avec VALFRAN : déroulement, espace nécessaire, météo, prix, devis.', alternates: { canonical: '/faq' } };

export default async function FaqPage() {
  const faqs = await listFaqs();
  return (
    <>
      <PageHero eyebrow="Questions fréquentes" title="Des réponses simples." />
      <section className="bg-paper">
        <div className="container-x py-16 lg:py-24">
          <div className="mx-auto max-w-3xl divide-y divide-graphite/10 border-y border-graphite/10">
            {faqs.map((f) => (
              <details key={f.id} className="group">
                <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-6 py-2 text-[1.1875rem] font-medium [&::-webkit-details-marker]:hidden">
                  <span>{f.question}</span>
                  <span className="relative size-4 shrink-0" aria-hidden="true"><span className="absolute inset-x-0 top-1/2 h-px bg-graphite" /><span className="absolute inset-y-0 left-1/2 w-px bg-graphite transition-transform group-open:scale-y-0" /></span>
                </summary>
                <p className="pb-7 pr-10 text-[1.0625rem] text-graphite/80">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) }} />
    </>
  );
}
