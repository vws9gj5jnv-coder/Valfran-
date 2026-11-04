import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Mail, Clock, CalendarCheck } from 'lucide-react';
import { PageHero } from '@/components/ui/Section';
import { ContactForm } from '@/components/home/ContactForm';
import { getSite } from '@/lib/site';

export const metadata: Metadata = { title: 'Contact', description: 'Contacter VALFRAN, mécanique automobile à domicile dans les Vosges et en Haute-Saône : téléphone, e-mail et formulaire.', alternates: { canonical: '/contact' } };

export default async function ContactPage() {
  const site = await getSite();
  const b = site.business;
  return (
    <>
      <PageHero eyebrow="Contact" title="Parlons de votre véhicule." intro="Le plus rapide : un appel. Pour une intervention, la demande de rendez-vous en ligne est la plus complète." />
      <section className="bg-paper">
        <div className="container-x grid gap-14 py-16 lg:grid-cols-[1fr_1.3fr] lg:py-24">
          <div className="space-y-8">
            <a href={site.phoneHref} className="card flex items-center gap-5 p-6 hover:border-graphite"><Phone className="size-7" strokeWidth={1.4} aria-hidden="true" /><span><span className="block text-mute">Téléphone</span><span className="text-[1.5rem] font-medium tabular-nums">{b.phone}</span></span></a>
            {b.email && <a href={`mailto:${b.email}`} className="card flex items-center gap-5 p-6 hover:border-graphite"><Mail className="size-7" strokeWidth={1.4} aria-hidden="true" /><span><span className="block text-mute">E-mail</span><span className="text-[1.125rem] font-medium">{b.email}</span></span></a>}
            <Link href="/rendez-vous" className="card flex items-center gap-5 p-6 hover:border-graphite"><CalendarCheck className="size-7" strokeWidth={1.4} aria-hidden="true" /><span><span className="block text-mute">Intervention</span><span className="text-[1.125rem] font-medium">Demande de rendez-vous en ligne</span></span></Link>
            <div className="flex gap-5 px-1"><Clock className="size-7 shrink-0" strokeWidth={1.4} aria-hidden="true" /><dl className="space-y-1">{b.hours.map((h) => <div key={h.label} className="flex gap-4"><dt className="min-w-[10rem] text-mute">{h.label}</dt><dd>{h.value}</dd></div>)}</dl></div>
            {b.googleBusinessUrl && <a className="link-u" href={b.googleBusinessUrl} target="_blank" rel="noopener">Voir notre fiche Google</a>}
          </div>
          <div className="card p-6 sm:p-10">
            <h2 className="text-h3 font-medium">Écrire un message</h2>
            <p className="mb-8 mt-2 text-mute">Pour une question générale. Nous répondons par téléphone ou par e-mail.</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
