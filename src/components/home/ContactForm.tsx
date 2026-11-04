'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Field, Notice } from '@/components/ui/Field';

export function ContactForm() {
  const [f, setF] = useState({ name: '', phone: '', email: '', body: '', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending'); setErrors({});
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const data = await res.json();
      if (res.ok) setState('sent');
      else { setErrors(data.fieldErrors ?? { form: data.message }); setState('idle'); }
    } catch { setState('error'); }
  }
  if (state === 'sent') return <Notice tone="ok" role="status" title="Message envoyé"><p className="flex items-center gap-2"><CheckCircle2 className="size-5" aria-hidden="true" /> Merci, nous vous répondons rapidement.</p></Notice>;
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Field label="Nom" error={errors.name}><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Téléphone" error={errors.phone}><input className="input" type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" /></Field>
        <Field label="E-mail" optional error={errors.email}><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></Field>
      </div>
      <Field label="Message" error={errors.body}><textarea className="input" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={3000} /></Field>
      <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-6 accent-graphite" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} /><span>J’accepte que mes informations soient utilisées pour répondre à mon message. <Link href="/confidentialite" className="link-u">En savoir plus</Link></span></label>
      {errors.consent && <p className="field-error">{errors.consent}</p>}
      {errors.form && <p className="field-error">{errors.form}</p>}
      {state === 'error' && <Notice tone="warn" role="alert">Connexion interrompue, message non envoyé. Réessayez ou appelez-nous.</Notice>}
      <button className="btn btn-dark" disabled={state === 'sending'}>{state === 'sending' && <Loader2 className="size-5 animate-spin" aria-hidden="true" />} Envoyer le message</button>
    </form>
  );
}
