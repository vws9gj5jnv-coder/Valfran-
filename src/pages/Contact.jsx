import { useState } from 'react';
import { Clock, Loader2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { BUSINESS } from '../data/business';
import { submitContact } from '../lib/api';

export default function Contact() {
  useMeta('Contact — Valfran Mécanique', 'Contactez Valfran Mécanique par téléphone, e-mail ou via le formulaire. Réponse rapide.');
  const [form, setForm] = useState({ name: '', email: '', phone: '', msg: '', consent: false });
  const [state, setState] = useState('idle');
  const set = (p) => setForm((f) => ({ ...f, ...p }));
  const submit = async (e) => { e.preventDefault(); setState('sending'); await submitContact(form); setState('done'); };

  return (
    <section className="pb-20 pt-28 sm:pt-36">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <span className="eyebrow">Contact</span>
          <h1 className="h-section mt-3">Parlons de votre véhicule</h1>
          <p className="lead mt-4">Une question, un devis particulier, une recherche de véhicule ? Réponse sous 24 h ouvrées.</p>
          <ul className="mt-8 space-y-4">
            <li><a href={BUSINESS.phoneHref} className="card card-hover flex items-center gap-4 p-4"><Phone className="text-ember-400" /><span><span className="block text-xs text-chrome-500">Téléphone</span>{BUSINESS.phone}</span></a></li>
            <li><a href={`mailto:${BUSINESS.email}`} className="card card-hover flex items-center gap-4 p-4"><Mail className="text-ember-400" /><span className="min-w-0"><span className="block text-xs text-chrome-500">E-mail</span><span className="break-all">{BUSINESS.email}</span></span></a></li>
            <li className="card flex items-center gap-4 p-4"><MapPin className="text-ember-400" /><span><span className="block text-xs text-chrome-500">Zone d'intervention</span>{BUSINESS.zone}</span></li>
            <li className="card flex items-start gap-4 p-4"><Clock className="mt-1 text-ember-400" /><span>{BUSINESS.hours.map((h) => <span key={h.days} className="block text-sm"><span className="text-chrome-500">{h.days} :</span> {h.time}</span>)}</span></li>
          </ul>
        </div>

        <div className="card p-6 sm:p-8">
          {state === 'done' ? (
            <div className="py-10 text-center" role="status">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-ink-950"><Send /></div>
              <h2 className="mt-4 text-2xl font-bold">Message envoyé</h2>
              <p className="mt-2 text-chrome-400">Merci ! Je reviens vers vous très vite.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="text-xl font-bold">Envoyer un message</h2>
              <div><label className="label" htmlFor="c-name">Nom</label><input id="c-name" required className="field" autoComplete="name" value={form.name} onChange={(e) => set({ name: e.target.value })} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label" htmlFor="c-mail">E-mail</label><input id="c-mail" required type="email" className="field" autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} /></div>
                <div><label className="label" htmlFor="c-tel">Téléphone</label><input id="c-tel" type="tel" className="field" autoComplete="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} /></div>
              </div>
              <div><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" required rows={5} className="field" value={form.msg} onChange={(e) => set({ msg: e.target.value })} /></div>
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-chrome-400">
                <input required type="checkbox" className="mt-0.5 h-4 w-4 accent-orange-500" checked={form.consent} onChange={(e) => set({ consent: e.target.checked })} />
                J'accepte que mes données soient utilisées pour répondre à ma demande.
              </label>
              <button className="btn-primary w-full sm:w-auto" disabled={state === 'sending'}>
                {state === 'sending' ? <><Loader2 size={16} className="animate-spin" /> Envoi…</> : <><Send size={16} /> Envoyer</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
