import Link from 'next/link';
import { ArrowRight, Phone, MapPin, ClipboardCheck, CalendarCheck, Wrench, HelpCircle, Box } from 'lucide-react';
import { EngineHero } from '@/components/three/engine/EngineHero';
import { SectionHead } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { ZoneMap } from '@/components/home/ZoneMap';
import { getSite } from '@/lib/site';
import { listServices, listCommunes, listFaqs, listPublishedTestimonials } from '@/modules/settings/repo';
import { euros } from '@/lib/text';

export default async function HomePage() {
  const [site, services, communes, faqs, testimonials] = await Promise.all([getSite(), listServices(), listCommunes(), listFaqs(), listPublishedTestimonials()]);
  const featured = communes.filter((c) => c.featured);
  const c = site.content;

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="on-dark relative overflow-hidden bg-graphite text-paper" aria-labelledby="hero-title">
        <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-[20%] top-[10%] h-[80%] w-[80%] rounded-full bg-[radial-gradient(closest-side,rgba(177,151,118,0.10),transparent)]" aria-hidden="true" />
        <div className="container-x relative grid items-center gap-6 pb-10 pt-10 sm:pt-14 lg:min-h-[min(860px,calc(100svh-72px))] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-4 lg:py-12">
          <div className="relative z-10 max-w-[38rem]">
            <p className="eyebrow flex items-center gap-3 text-alu">
              <span className="h-px w-8 bg-champagne" aria-hidden="true" />
              {site.business.name} · Mécanique à domicile
            </p>
            <h1 id="hero-title" className="display mt-6 text-display">
              {c.heroTitle}
            </h1>
            <p className="mt-6 max-w-[34rem] text-lead text-paper/80">{c.heroSubtitle}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/rendez-vous" className="btn btn-accent">
                Prendre rendez-vous <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              <Link href="/services" className="btn btn-outline-light">Découvrir nos prestations</Link>
            </div>
            <div className="mt-8 flex flex-col gap-3 text-[1rem] text-paper/75 sm:flex-row sm:items-center sm:gap-8">
              <a href={site.phoneHref} className="inline-flex min-h-[44px] items-center gap-3 text-paper hover:text-champagne-2">
                <span className="inline-flex size-10 items-center justify-center rounded-sm border border-paper/15"><Phone className="size-[18px]" aria-hidden="true" /></span>
                <span><span className="block text-[0.8125rem] text-paper/60">Par téléphone</span><span className="text-[1.125rem] font-medium tabular-nums">{site.business.phone}</span></span>
              </a>
              <p className="inline-flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-sm border border-paper/15"><MapPin className="size-[18px]" aria-hidden="true" /></span>
                <span><span className="block text-[0.8125rem] text-paper/60">Secteur</span><span className="text-paper">Vosges (88) · Haute-Saône (70)</span></span>
              </p>
            </div>
          </div>
          <div className="relative -mx-5 sm:mx-0 lg:-mr-8">
            <EngineHero poster="/media/engine-poster.webp" />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- 3 ÉTAPES */}
      <section className="bg-paper" aria-labelledby="etapes-title">
        <div className="container-x py-20 lg:py-28">
          <SectionHead id="etapes-title" eyebrow="Comment ça marche" title="Trois étapes, aucun déplacement." intro="Vous décrivez le besoin, nous confirmons ensemble, l’intervention a lieu chez vous." />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-sm border border-graphite/10 bg-graphite/10 md:grid-cols-3">
            {[
              { icon: ClipboardCheck, title: 'Votre demande', text: 'Votre véhicule, l’intervention souhaitée et l’adresse. Environ deux minutes, sans créer de compte.' },
              { icon: CalendarCheck, title: 'Notre confirmation', text: 'Nous vous rappelons pour confirmer le créneau, les conditions et le montant. Rien n’est engagé avant votre accord.' },
              { icon: Wrench, title: 'L’intervention', text: 'Le jour convenu, l’atelier se déplace à votre domicile ou sur votre lieu de travail.' },
            ].map((s, i) => (
              <li key={s.title} className="bg-paper p-8 lg:p-10">
                <Reveal delay={i * 90}>
                  <div className="flex items-center justify-between">
                    <s.icon className="size-7 text-graphite" strokeWidth={1.4} aria-hidden="true" />
                    <span className="text-[0.875rem] tabular-nums text-champagne-ink" style={{ fontStretch: '115%' }}>0{i + 1}</span>
                  </div>
                  <h3 className="mt-10 text-h3 font-medium">{s.title}</h3>
                  <p className="mt-3 text-mute">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- PRESTATIONS */}
      <section className="bg-white" aria-labelledby="services-title">
        <div className="container-x py-20 lg:py-28">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHead id="services-title" eyebrow="Prestations" title="L’essentiel de la mécanique, à domicile." />
            <Link href="/services" className="btn btn-outline-dark self-start md:self-auto">Toutes les prestations</Link>
          </div>
          <ul className="mt-14 grid gap-px overflow-hidden rounded-sm border border-graphite/10 bg-graphite/10 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.slug} className="bg-white">
                <Link href={`/services/${s.slug}`} className="group flex h-full flex-col p-7 transition-colors hover:bg-paper lg:p-8">
                  <span className="text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-mute" style={{ fontStretch: '110%' }}>{s.category}</span>
                  <span className="mt-4 text-[1.3125rem] font-medium leading-snug">{s.name}</span>
                  <span className="mt-2 text-mute">{s.shortDescription}</span>
                  <span className="mt-auto flex items-center justify-between pt-6 text-[0.9375rem]">
                    <span className="text-graphite/80">
                      {s.priceValidated && s.laborPriceCents !== null ? <>Dès {euros(s.laborPriceCents)}{site.pricing.demoPrices && <span className="text-mute"> · tarif démo</span>}</> : 'Sur devis'}
                    </span>
                    <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
            <li className="bg-graphite text-paper">
              <Link href="/rendez-vous?panne=inconnue" className="group flex h-full flex-col p-7 lg:p-8">
                <HelpCircle className="size-7 text-champagne" strokeWidth={1.4} aria-hidden="true" />
                <span className="mt-4 text-[1.3125rem] font-medium leading-snug">Je ne sais pas quelle est la panne</span>
                <span className="mt-2 text-paper/70">Décrivez simplement ce que vous constatez : nous commençons par un diagnostic.</span>
                <span className="mt-auto flex items-center gap-2 pt-6 text-champagne-2">Demander un diagnostic <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- GARAGE VIRTUEL */}
      <section className="on-dark relative overflow-hidden bg-anthracite text-paper" aria-labelledby="garage-title">
        <div className="container-x grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <SectionHead tone="dark" id="garage-title" eyebrow="Garage virtuel" title="Explorez, sélectionnez, demandez." intro="Une voiture de démonstration en 3D : touchez une roue, le moteur ou la batterie pour découvrir les interventions possibles, puis demandez directement un rendez-vous. Entièrement facultatif." />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/garage-virtuel" className="btn btn-light"><Box className="size-5" aria-hidden="true" /> Entrer dans le garage</Link>
              <Link href="/rendez-vous" className="btn btn-outline-light">Réserver sans passer par le garage</Link>
            </div>
          </div>
          <Reveal>
            <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-paper/10 bg-graphite">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/garage-poster.webp" alt="Aperçu du garage virtuel : véhicule de démonstration dans un atelier épuré" loading="lazy" className="size-full object-cover" width={1600} height={1000} />
              <p className="absolute bottom-3 left-3 rounded-xs bg-graphite/70 px-2 py-1 text-[0.8125rem] text-paper/80">Prototype 3D de démonstration</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- ZONES */}
      <section className="bg-paper" aria-labelledby="zones-title">
        <div className="container-x grid gap-12 py-20 lg:grid-cols-[1fr_1.1fr] lg:py-28">
          <div>
            <SectionHead id="zones-title" eyebrow="Zones d’intervention" title="Des Vosges à la Haute-Saône." intro={`Au départ de ${site.zone.baseName}, dans un rayon d’environ ${site.zone.maxKm} km par la route. Votre adresse est vérifiée automatiquement lors de la demande.`} />
            <ul className="mt-10 grid grid-cols-2 gap-x-6 border-t border-graphite/10">
              {featured.map((cm) => (
                <li key={cm.slug} className="border-b border-graphite/10">
                  <Link href={`/zones-intervention/${cm.slug}`} className="flex min-h-[56px] items-center justify-between gap-3 hover:text-champagne-ink">
                    <span>{cm.name}</span><span className="text-[0.875rem] text-mute">{cm.department}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/zones-intervention" className="mt-8 inline-flex min-h-[44px] items-center gap-2 font-semibold link-u">Toutes les communes desservies <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <Reveal>
            <ZoneMap communes={communes} base={{ lat: site.zone.baseLat, lon: site.zone.baseLon, name: site.zone.baseName }} />
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- ENGAGEMENTS */}
      <section className="bg-white" aria-labelledby="engagements-title">
        <div className="container-x py-20 lg:py-28">
          <SectionHead id="engagements-title" eyebrow="Nos engagements" title="Clair avant, soigné pendant, honnête après." />
          <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Devis avant intervention', 'Le montant est validé par vous avant le début des travaux.'],
              ['Pas de compte à créer', 'Un nom, un téléphone et une adresse suffisent pour faire une demande.'],
              ['Faisabilité annoncée', 'Si une réparation demande un atelier fixe, nous vous le disons avant de nous déplacer.'],
              ['Vos données protégées', 'Utilisées uniquement pour traiter votre demande, jamais revendues.'],
            ].map(([t, d], i) => (
              <li key={t}>
                <Reveal delay={i * 80}>
                  <span className="block h-px w-10 bg-champagne" aria-hidden="true" />
                  <h3 className="mt-6 text-[1.1875rem] font-semibold">{t}</h3>
                  <p className="mt-2 text-mute">{d}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- AVIS (uniquement authentiques) */}
      {testimonials.length > 0 && (
        <section className="bg-paper" aria-labelledby="avis-title">
          <div className="container-x py-20 lg:py-28">
            <SectionHead id="avis-title" eyebrow="Avis clients" title="Ce qu’en disent nos clients." />
            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.slice(0, 3).map((t) => (
                <li key={t.id} className="card p-7">
                  <blockquote className="text-[1.0625rem]">« {t.text} »</blockquote>
                  <p className="mt-5 text-[0.9375rem] text-mute">{t.author} · {t.sourceUrl ? <a className="link-u" href={t.sourceUrl} rel="noopener" target="_blank">{t.source}</a> : t.source}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- FAQ (extrait) */}
      <section className="bg-paper" aria-labelledby="faq-title">
        <div className="container-x grid gap-12 py-20 lg:grid-cols-[1fr_1.4fr] lg:py-28">
          <div>
            <SectionHead id="faq-title" eyebrow="Questions fréquentes" title="Vous vous demandez peut-être…" />
            <Link href="/faq" className="btn btn-outline-dark mt-8">Toutes les réponses</Link>
          </div>
          <div className="divide-y divide-graphite/10 border-y border-graphite/10">
            {faqs.slice(0, 4).map((f) => (
              <details key={f.id} className="group py-1">
                <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 text-[1.125rem] font-medium [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <span className="relative size-4 shrink-0" aria-hidden="true">
                    <span className="absolute inset-x-0 top-1/2 h-px bg-graphite" />
                    <span className="absolute inset-y-0 left-1/2 w-px bg-graphite transition-transform group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="pb-6 pr-10 text-mute">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- APPEL FINAL */}
      <section className="on-dark bg-graphite text-paper">
        <div className="container-x flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center lg:py-20">
          <div>
            <h2 className="text-h2 font-light wide">Une intervention à prévoir ?</h2>
            <p className="mt-3 text-lead text-paper/70">{c.bookingIntro}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/rendez-vous" className="btn btn-accent">Prendre rendez-vous <ArrowRight className="size-5" aria-hidden="true" /></Link>
            <a href={site.phoneHref} className="btn btn-outline-light"><Phone className="size-5" aria-hidden="true" /> {site.business.phone}</a>
          </div>
        </div>
      </section>
    </>
  );
}
