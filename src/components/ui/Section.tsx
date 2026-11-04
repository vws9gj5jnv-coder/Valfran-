export function SectionHead({ eyebrow, title, intro, tone = 'light', id }: { eyebrow?: string; title: React.ReactNode; intro?: React.ReactNode; tone?: 'light' | 'dark'; id?: string }) {
  return (
    <div className="max-w-3xl">
      {eyebrow && (
        <p className={`eyebrow flex items-center gap-3 ${tone === 'dark' ? 'text-alu' : 'text-champagne-ink'}`}>
          <span className="h-px w-8 bg-champagne" aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <h2 id={id} className={`mt-5 text-h2 font-light wide ${tone === 'dark' ? 'text-paper' : 'text-graphite'}`}>{title}</h2>
      {intro && <p className={`mt-5 text-lead ${tone === 'dark' ? 'text-paper/75' : 'text-mute'}`}>{intro}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, intro, children }: { eyebrow?: string; title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="on-dark relative overflow-hidden bg-graphite text-paper">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-x relative py-16 sm:py-20 lg:py-24">
        {eyebrow && (
          <p className="eyebrow flex items-center gap-3 text-alu">
            <span className="h-px w-8 bg-champagne" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h1 className="mt-5 max-w-4xl text-h1 font-light wide">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-lead text-paper/75">{intro}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Fil d’Ariane" className="mb-6 text-[0.9375rem] text-paper/60">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {it.href ? <a href={it.href} className="hover:text-paper">{it.label}</a> : <span aria-current="page" className="text-paper/85">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
