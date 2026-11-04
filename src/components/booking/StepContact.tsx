'use client';

import { Field, Notice } from '@/components/ui/Field';
import type { Draft, WizardConfig } from './types';
import type { Window } from '@/modules/availability/windows';
import { buildEstimate } from '@/modules/pricing/estimate';
import { euros } from '@/lib/text';
import { slotLabel } from './StepSlots';
import Link from 'next/link';

export function StepContact({ draft, set, cfg, errors, windows, goTo }: {
  draft: Draft; set: (p: Partial<Draft>) => void; cfg: WizardConfig; errors: Record<string, string>; windows: Window[]; goTo: (step: number) => void;
}) {
  const c = draft.contact;
  const setC = (p: Partial<Draft['contact']>) => set({ contact: { ...c, ...p } });
  const selected = cfg.services.filter((s) => draft.services.includes(s.slug));
  const diag = cfg.services.find((s) => s.isDiagnostic) ?? null;
  const zone = draft.address.check;
  const estimate = buildEstimate({
    services: selected, unknownIssue: draft.unknownIssue, diagnosticService: diag,
    travelFeeCents: zone?.feeCents ?? null, zoneStatus: zone ? (zone.status === 'unknown' ? 'on_request' : zone.status) : 'on_request',
    demoPrices: cfg.demoPrices, disclaimer: cfg.estimateDisclaimer,
  });
  const v = draft.vehicle;
  const vehicleText = [v.make.trim(), v.model.trim(), v.engine, v.year ? `(${v.year})` : ''].filter(Boolean).join(' ') || '—';
  const servicesText = [draft.unknownIssue ? 'Diagnostic (panne à identifier)' : '', ...selected.map((s) => s.name)].filter(Boolean).join(', ');

  return (
    <div className="space-y-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Nom et prénom" error={errors['contact.name']} className="sm:col-span-2">
          <input className="input" value={c.name} onChange={(e) => setC({ name: e.target.value })} autoComplete="name" name="name" maxLength={100} />
        </Field>
        <Field label="Téléphone" hint="Pour confirmer le rendez-vous." error={errors['contact.phone']}>
          <input className="input tabular-nums" type="tel" inputMode="tel" value={c.phone} onChange={(e) => setC({ phone: e.target.value })} autoComplete="tel" name="phone" maxLength={20} placeholder="06 12 34 56 78" />
        </Field>
        <Field label="E-mail" optional={c.preference !== 'email'} hint="Pour recevoir le récapitulatif." error={errors['contact.email']}>
          <input className="input" type="email" inputMode="email" value={c.email} onChange={(e) => setC({ email: e.target.value })} autoComplete="email" name="email" maxLength={120} />
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="field-label">Comment préférez-vous être contacté ?</legend>
          <div className="grid grid-cols-3 gap-2">
            {([['phone', 'Appel'], ['sms', 'SMS'], ['email', 'E-mail']] as const).map(([k, label]) => (
              <label key={k} className={`flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-sm border text-[1rem] font-semibold ${c.preference === k ? 'border-graphite bg-graphite text-paper' : 'border-graphite/20 bg-white hover:border-graphite/50'}`}>
                <input type="radio" name="preference" value={k} checked={c.preference === k} onChange={() => setC({ preference: k })} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <section aria-labelledby="recap-title" className="rounded-sm border border-graphite/15 bg-white">
        <h3 id="recap-title" className="border-b border-graphite/10 px-5 py-4 text-[1.1875rem] font-semibold">Récapitulatif de votre demande</h3>
        <dl className="divide-y divide-graphite/10">
          {[
            { t: 'Véhicule', d: <>{vehicleText}{v.plate && v.source === 'plate' ? <span className="text-mute"> · {v.plate}</span> : null}</>, step: 0 },
            { t: 'Intervention', d: <>{servicesText}{draft.attachments.length ? <span className="text-mute"> · {draft.attachments.length} photo{draft.attachments.length > 1 ? 's' : ''}</span> : null}</>, step: 1 },
            { t: 'Adresse', d: `${draft.address.street}, ${draft.address.postcode} ${draft.address.city}`, step: 2 },
            { t: 'Créneaux souhaités', d: draft.slots.length ? <ul>{draft.slots.map((s) => <li key={s}>{slotLabel(s, windows)}</li>)}</ul> : (draft.availabilityNote || 'À convenir par téléphone'), step: 3 },
          ].map((row) => (
            <div key={row.t} className="grid gap-1 px-5 py-4 sm:grid-cols-[11rem_1fr_auto] sm:gap-4">
              <dt className="text-mute">{row.t}</dt>
              <dd>{row.d}</dd>
              <dd><button type="button" className="inline-flex min-h-[44px] items-center font-semibold link-u" onClick={() => goTo(row.step)}>Modifier<span className="sr-only"> : {row.t}</span></button></dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-graphite/10 bg-paper px-5 py-5">
          <p className="font-semibold">{estimate.kind === 'estimation' ? 'Estimation indicative' : 'Tarif'}</p>
          <ul className="mt-2 space-y-1">
            {estimate.lines.map((l) => (
              <li key={l.label} className="flex justify-between gap-4">
                <span>{l.label}</span>
                <span className="text-right">{l.amountCents !== null ? (l.amountCents === 0 ? 'Offert' : euros(l.amountCents)) : <span className="text-mute">{l.note}</span>}</span>
              </li>
            ))}
          </ul>
          {estimate.knownTotalCents !== null && <p className="mt-3 flex justify-between border-t border-graphite/10 pt-3 font-semibold"><span>Total connu {estimate.partsExcluded ? '(hors pièces)' : ''}</span><span>{euros(estimate.knownTotalCents)}</span></p>}
          <p className="mt-3 text-[0.9375rem] text-mute">{estimate.needsQuote ? 'Un devis personnalisé vous sera proposé après vérification. ' : ''}{estimate.disclaimer}</p>
          {estimate.demoPrices && <p className="mt-2 text-[0.875rem] text-champagne-ink">Tarifs de démonstration.</p>}
        </div>
      </section>

      <div>
        <label className={`flex cursor-pointer items-start gap-4 rounded-sm border bg-white p-4 ${errors.consent ? 'border-danger' : 'border-graphite/15'}`}>
          <input type="checkbox" checked={draft.consent} onChange={(e) => set({ consent: e.target.checked })} className="mt-1 size-6 shrink-0 accent-graphite" aria-describedby={errors.consent ? 'consent-err' : undefined} />
          <span>
            J’accepte que mes informations soient utilisées pour traiter ma demande de rendez-vous.{' '}
            <Link href="/confidentialite" target="_blank" className="link-u">En savoir plus</Link>
          </span>
        </label>
        {errors.consent && <p id="consent-err" className="field-error" role="alert">{errors.consent}</p>}
      </div>
      {cfg.demo && <Notice tone="demo">Mode démonstration : la demande sera réellement enregistrée dans la base de démonstration, mais aucun e-mail ni SMS ne sera envoyé.</Notice>}
    </div>
  );
}
