import type { Metadata } from 'next';
import Link from 'next/link';
import { eq, inArray } from 'drizzle-orm';
import { PageHero } from '@/components/ui/Section';
import { listPublishedRealisations, listServices, getSetting } from '@/modules/settings/repo';
import { getDb } from '@/db/client';
import { attachments } from '@/db/schema';

export const metadata: Metadata = { title: 'Réalisations', description: 'Interventions réelles de mécanique automobile à domicile réalisées par VALFRAN dans les Vosges et en Haute-Saône.', alternates: { canonical: '/realisations' } };

const dateFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

export default async function RealisationsPage() {
  const [items, services, content] = await Promise.all([listPublishedRealisations(), listServices({ includeInactive: true }), getSetting('content')]);
  const db = await getDb();
  const photos = items.length ? await db.select().from(attachments).where(inArray(attachments.realisationId, items.map((i) => i.id))) : [];
  void eq;
  return (
    <>
      <PageHero eyebrow="Réalisations" title="Le travail, sur le terrain." intro={content.realisationsIntro} />
      <section className="bg-paper">
        <div className="container-x py-16 lg:py-24">
          {items.length === 0 ? (
            <div className="mx-auto max-w-xl text-center">
              <p className="text-h3 font-light wide">Les premières réalisations arrivent bientôt.</p>
              <p className="mt-4 text-mute">Nous ne publions que des photographies d’interventions réelles, avec l’accord de nos clients. Aucune image d’illustration n’est présentée comme une réalisation.</p>
              <Link href="/rendez-vous" className="btn btn-dark mt-8">Prendre rendez-vous</Link>
            </div>
          ) : (
            <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => {
                const ph = photos.filter((p) => p.realisationId === r.id);
                return (
                  <li key={r.id} className="card overflow-hidden">
                    {ph[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/files/${ph[0].id}`} alt={r.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    )}
                    <div className="p-6">
                      <p className="text-[0.875rem] text-mute">{[services.find((s) => s.slug === r.serviceSlug)?.name, r.commune, r.date ? dateFmt.format(r.date) : ''].filter(Boolean).join(' · ')}</p>
                      <h2 className="mt-2 text-[1.25rem] font-medium">{r.title}</h2>
                      {r.description && <p className="mt-2 text-mute">{r.description}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
