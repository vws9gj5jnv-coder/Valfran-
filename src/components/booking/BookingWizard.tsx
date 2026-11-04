'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, Phone, RotateCcw } from 'lucide-react';
import { Notice } from '@/components/ui/Field';
import { StepVehicle } from './StepVehicle';
import { StepService } from './StepService';
import { StepAddress } from './StepAddress';
import { StepSlots } from './StepSlots';
import { StepContact } from './StepContact';
import { emptyDraft, type Draft, type WizardConfig } from './types';
import type { Window } from '@/modules/availability/windows';

const STORAGE_KEY = 'valfran-demande-v1';
const MAX_AGE = 7 * 24 * 3600 * 1000;
const STEPS = [
  { title: 'Votre véhicule', short: 'Véhicule' },
  { title: 'L’intervention', short: 'Intervention' },
  { title: 'L’adresse d’intervention', short: 'Adresse' },
  { title: 'Vos disponibilités', short: 'Créneaux' },
  { title: 'Vos coordonnées', short: 'Coordonnées' },
];

const newKey = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^A-Za-z0-9]/g, '').slice(0, 40).padEnd(20, '0');

function validateStep(step: number, d: Draft): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 0) {
    if (d.vehicle.source === 'plate' && !d.vehicle.identified) e['vehicle.plate'] = 'Identifiez votre véhicule, ou choisissez-le manuellement.';
    if (d.vehicle.source === 'manual') {
      if (!d.vehicle.make.trim()) e['vehicle.make'] = 'Indiquez la marque.';
      if (!d.vehicle.model.trim()) e['vehicle.model'] = 'Indiquez le modèle.';
    }
  }
  if (step === 1) {
    if (!d.unknownIssue && d.services.length === 0) e.services = 'Choisissez au moins une intervention, ou « Je ne sais pas quelle est la panne ».';
    if (d.unknownIssue && d.description.trim().length < 5) e.description = 'Décrivez en quelques mots ce que vous constatez.';
    if (d.vehicle.vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(d.vehicle.vin)) e['vehicle.vin'] = 'Le numéro VIN comporte 17 caractères (lettres et chiffres, sans I, O ni Q).';
  }
  if (step === 2) {
    if (d.address.street.trim().length < 3) e['address.street'] = 'Indiquez le numéro et la rue.';
    if (!/^\d{5}$/.test(d.address.postcode) || !d.address.city) e['address.postcode'] = 'Choisissez votre commune dans la liste (ou tapez « code postal commune »).';
    else if (d.address.check?.status === 'outside') e['address.postcode'] = 'Cette adresse est hors de notre zone d’intervention.';
  }
  if (step === 4) {
    if (d.contact.name.trim().length < 2) e['contact.name'] = 'Indiquez votre nom.';
    const digits = d.contact.phone.replace(/[^\d+]/g, '').replace(/^\+33/, '0').replace(/^0033/, '0');
    if (!/^0[1-9]\d{8}$/.test(digits)) e['contact.phone'] = 'Numéro à 10 chiffres, par exemple 06 12 34 56 78.';
    if (d.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact.email)) e['contact.email'] = 'Adresse e-mail invalide.';
    if (d.contact.preference === 'email' && !d.contact.email) e['contact.email'] = 'Indiquez votre e-mail pour être contacté par e-mail.';
    if (!d.consent) e.consent = 'Cochez cette case pour que nous puissions traiter votre demande.';
  }
  return e;
}

export function BookingWizard({ cfg, initial }: { cfg: WizardConfig; initial: { services?: string[]; unknownIssue?: boolean } }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [restored, setRestored] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [windows, setWindows] = useState<Window[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Restauration d'une demande en cours (stockée uniquement sur cet appareil).
  useEffect(() => {
    let d = emptyDraft(newKey());
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Draft;
        if (saved.version === 1 && Date.now() - saved.savedAt < MAX_AGE) { d = { ...d, ...saved }; setRestored(saved.step > 0 || saved.services.length > 0); }
      }
    } catch { /* stockage indisponible : on repart de zéro */ }
    if (initial.services?.length) d = { ...d, services: [...new Set([...d.services, ...initial.services.filter((s) => cfg.services.some((x) => x.slug === s))])] };
    if (initial.unknownIssue) d = { ...d, unknownIssue: true };
    setDraft(d);
  }, [initial.services, initial.unknownIssue, cfg.services]);

  useEffect(() => {
    if (!draft) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, savedAt: Date.now() })); } catch { /* ignore */ }
  }, [draft]);

  useEffect(() => {
    if (!draft) return;
    if (firstRender.current) { firstRender.current = false; return; }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }, [draft?.step]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d)), []);
  const onWindows = useCallback((w: Window[]) => setWindows(w), []);

  if (!draft) {
    return <div className="flex min-h-[40vh] items-center justify-center text-mute"><Loader2 className="mr-2 size-5 animate-spin" aria-hidden="true" /> Chargement…</div>;
  }

  const step = draft.step;
  const goTo = (s: number) => { setErrors({}); setSubmitError(null); set({ step: s }); };
  const next = () => {
    const e = validateStep(step, draft);
    setErrors(e);
    if (Object.keys(e).length) {
      setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"], .field-error')?.scrollIntoView({ block: 'center' }), 0);
      return;
    }
    goTo(step + 1);
  };
  const reset = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setRestored(false);
    setErrors({});
    setDraft(emptyDraft(newKey()));
  };

  async function submit() {
    if (!draft) return;
    const e = validateStep(4, draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    setSubmitError(null);
    const v = draft.vehicle;
    const payload = {
      idempotencyKey: draft.idempotencyKey,
      vehicle: { source: v.source, plate: v.plate, make: v.make.trim(), model: v.model.trim(), year: v.year, engine: v.engine, fuel: v.fuel, vin: v.vin },
      services: draft.services,
      unknownIssue: draft.unknownIssue,
      description: draft.description,
      address: { street: draft.address.street, postcode: draft.address.postcode, city: draft.address.city },
      preferredSlots: draft.slots,
      availabilityNote: draft.availabilityNote,
      contact: draft.contact,
      consent: draft.consent,
      attachmentIds: draft.attachments.map((a) => a.id),
      website: (document.getElementById('vf-website') as HTMLInputElement | null)?.value ?? '',
    };
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        router.push(`/rendez-vous/confirmation?ref=${encodeURIComponent(data.reference)}&t=${encodeURIComponent(data.token)}`);
        return;
      }
      if (data.error === 'validation') {
        setErrors(data.fieldErrors ?? {});
        const keys = Object.keys(data.fieldErrors ?? {});
        const target = keys.some((k) => k.startsWith('vehicle')) ? 0 : keys.some((k) => k === 'services' || k === 'description') ? 1 : keys.some((k) => k.startsWith('address')) ? 2 : 4;
        if (target !== 4) set({ step: target });
        setSubmitError('Certaines informations sont à corriger.');
      } else if (data.error === 'slots_unavailable') {
        set({ step: 3, slots: [] });
        setSubmitError(data.message);
      } else {
        setSubmitError(data.message ?? 'La demande n’a pas pu être enregistrée.');
      }
    } catch {
      setSubmitError('Connexion interrompue : votre demande n’a pas été envoyée. Vos informations sont conservées sur cet appareil, vous pouvez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  const requirements = [...new Set(cfg.services.filter((s) => draft.services.includes(s.slug)).flatMap((s) => s.requirements))];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progression */}
      <nav aria-label="Étapes de la demande" className="mb-8">
        <p className="text-[0.9375rem] text-mute">Étape {step + 1} sur {STEPS.length}</p>
        <ol className="mt-3 grid grid-cols-5 gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s.short}>
              <span className={`block h-1 rounded-full ${i <= step ? 'bg-graphite' : 'bg-graphite/15'}`} aria-hidden="true" />
              <span className={`mt-2 hidden text-[0.8125rem] sm:block ${i === step ? 'font-semibold text-graphite' : 'text-mute'}`} aria-current={i === step ? 'step' : undefined}>{s.short}</span>
            </li>
          ))}
        </ol>
      </nav>

      {restored && step > 0 && (
        <div className="mb-6">
          <Notice tone="info">
            Nous avons conservé votre demande en cours sur cet appareil.{' '}
            <button type="button" className="inline-flex items-center gap-1 font-semibold link-u" onClick={reset}><RotateCcw className="size-4" aria-hidden="true" /> Recommencer</button>
          </Notice>
        </div>
      )}

      <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-28 text-h2 font-light wide outline-none">{STEPS[step].title}</h2>

      <form
        className="step-enter mt-8"
        key={step}
        noValidate
        onSubmit={(e) => { e.preventDefault(); if (step < 4) next(); else submit(); }}
      >
        {/* Champ piège anti-robots : invisible pour les personnes, ignoré par les lecteurs d'écran */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="vf-website">Site web</label>
          <input id="vf-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        {step === 0 && <StepVehicle draft={draft} update={(p) => set({ vehicle: { ...draft.vehicle, ...p } })} cfg={cfg} errors={errors} />}
        {step === 1 && <StepService draft={draft} set={set} cfg={cfg} errors={errors} />}
        {step === 2 && <StepAddress draft={draft} update={(p) => setDraft((d) => (d ? { ...d, address: { ...d.address, ...p } } : d))} cfg={cfg} errors={errors} requirements={requirements} />}
        {step === 3 && <StepSlots draft={draft} set={set} errors={errors} onWindows={onWindows} />}
        {step === 4 && <StepContact draft={draft} set={set} cfg={cfg} errors={errors} windows={windows} goTo={goTo} />}

        {submitError && <div className="mt-8"><Notice tone="danger" role="alert" title="Demande non envoyée">{submitError} <span className="block mt-1">Vous pouvez aussi nous appeler au <a className="link-u font-semibold" href={cfg.phoneHref}>{cfg.phone}</a>.</span></Notice></div>}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-graphite/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button type="button" className="btn btn-ghost justify-start" onClick={() => goTo(step - 1)}><ArrowLeft className="size-5" aria-hidden="true" /> Retour</button>
          ) : (
            <a href={cfg.phoneHref} className="btn btn-ghost justify-start"><Phone className="size-5" aria-hidden="true" /> Préférez appeler ? {cfg.phone}</a>
          )}
          {step < 4 ? (
            <button type="submit" className="btn btn-dark sm:min-w-[220px]">Continuer <ArrowRight className="size-5" aria-hidden="true" /></button>
          ) : (
            <button type="submit" className="btn btn-accent sm:min-w-[260px]" disabled={submitting}>
              {submitting ? <><Loader2 className="size-5 animate-spin" aria-hidden="true" /> Envoi en cours…</> : <>Envoyer ma demande <ArrowRight className="size-5" aria-hidden="true" /></>}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
