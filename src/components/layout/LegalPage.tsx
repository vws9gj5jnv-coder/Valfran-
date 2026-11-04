import { PageHero } from '@/components/ui/Section';

/** Valeur légale : affiche clairement un champ non renseigné plutôt que d'inventer une donnée. */
export function V({ v, label }: { v: string; label: string }) {
  return v ? <>{v}</> : <mark className="rounded-xs bg-[#f6e7c8] px-1 text-graphite">[À compléter : {label}]</mark>;
}

export function LegalPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero eyebrow="Informations légales" title={title} />
      <section className="bg-paper">
        <div className="container-x py-16 lg:py-20">
          <div className="prose-vf mx-auto max-w-3xl text-[1.0625rem]">
            {updated && <p className="text-mute">Dernière mise à jour : {updated}</p>}
            {children}
          </div>
        </div>
      </section>
    </>
  );
}
