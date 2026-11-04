'use client';

import { useRef, useState } from 'react';
import { Check, HelpCircle, ImagePlus, Loader2, X, ChevronDown } from 'lucide-react';
import { Field, Notice } from '@/components/ui/Field';
import type { Draft, WizardConfig } from './types';
import { euros } from '@/lib/text';

export function StepService({ draft, set, cfg, errors }: {
  draft: Draft; set: (p: Partial<Draft>) => void; cfg: WizardConfig; errors: Record<string, string>;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (slug: string) => {
    const has = draft.services.includes(slug);
    set({ services: has ? draft.services.filter((s) => s !== slug) : [...draft.services, slug].slice(0, 6) });
  };

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(null);
    setUploading(true);
    const added: Draft['attachments'] = [];
    for (const f of [...files].slice(0, 5 - draft.attachments.length)) {
      if (f.size > 8 * 1024 * 1024) { setUploadError(`« ${f.name} » dépasse 8 Mo.`); continue; }
      const fd = new FormData();
      fd.append('file', f);
      try {
        const res = await fetch('/api/uploads', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) setUploadError(data.message ?? 'Envoi impossible.');
        else added.push({ id: data.id, name: data.name, size: data.size });
      } catch {
        setUploadError('Envoi interrompu. Vérifiez votre connexion et réessayez.');
      }
    }
    set({ attachments: [...draft.attachments, ...added] });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  const needsVin = cfg.services.some((s) => draft.services.includes(s.slug) && s.infoNeeded.some((i) => i.includes('VIN')));

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="field-label">Quelle intervention souhaitez-vous ? <span className="font-normal text-mute">(une ou plusieurs)</span></legend>
        {errors.services && <p className="field-error mb-3" role="alert">{errors.services}</p>}
        <ul className="grid gap-3">
          <li>
            <button
              type="button"
              aria-pressed={draft.unknownIssue}
              onClick={() => set({ unknownIssue: !draft.unknownIssue })}
              className={`flex min-h-[72px] w-full items-center gap-4 rounded-sm border px-5 py-4 text-left transition-colors ${draft.unknownIssue ? 'border-graphite bg-graphite text-paper' : 'border-graphite/20 bg-white hover:border-graphite/50'}`}
            >
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-xs border ${draft.unknownIssue ? 'border-champagne bg-champagne text-graphite' : 'border-graphite/30'}`}>
                {draft.unknownIssue ? <Check className="size-5" aria-hidden="true" /> : <HelpCircle className="size-5 text-graphite/50" aria-hidden="true" />}
              </span>
              <span>
                <span className="block text-[1.125rem] font-semibold">Je ne sais pas quelle est la panne</span>
                <span className={draft.unknownIssue ? 'text-paper/75' : 'text-mute'}>Nous commençons par un diagnostic.</span>
              </span>
            </button>
          </li>
          {cfg.services.map((s) => {
            const on = draft.services.includes(s.slug);
            const price = s.priceValidated && s.laborPriceCents !== null ? `Dès ${euros(s.laborPriceCents)}` : 'Sur devis';
            return (
              <li key={s.slug} className={`rounded-sm border bg-white transition-colors ${on ? 'border-graphite ring-1 ring-graphite' : 'border-graphite/20'}`}>
                <div className="flex items-stretch">
                  <button type="button" aria-pressed={on} onClick={() => toggle(s.slug)} className="flex min-h-[72px] flex-1 items-center gap-4 px-5 py-4 text-left">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-xs border ${on ? 'border-graphite bg-graphite text-paper' : 'border-graphite/30'}`}>
                      {on && <Check className="size-5" aria-hidden="true" />}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[1.125rem] font-semibold">{s.name}</span>
                      <span className="text-mute">{s.shortDescription}</span>
                    </span>
                    <span className="hidden shrink-0 text-right text-[0.9375rem] sm:block">
                      <span className="block font-semibold">{price}</span>
                      {s.priceValidated && s.laborPriceCents !== null && <span className="text-mute">{cfg.demoPrices ? 'tarif démo' : 'main-d’œuvre'}</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="flex w-14 shrink-0 items-center justify-center border-l border-graphite/10 text-graphite/70 hover:text-graphite"
                    aria-expanded={open === s.slug}
                    aria-controls={`details-${s.slug}`}
                    aria-label={`Détails : ${s.name}`}
                    onClick={() => setOpen(open === s.slug ? null : s.slug)}
                  >
                    <ChevronDown className={`size-5 transition-transform ${open === s.slug ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                </div>
                <div id={`details-${s.slug}`} hidden={open !== s.slug} className="border-t border-graphite/10 px-5 py-4 text-[0.9688rem]">
                  <p className="sm:hidden"><strong>{price}</strong>{s.priceValidated && s.laborPriceCents !== null && ` (${cfg.demoPrices ? 'tarif démo' : 'main-d’œuvre'})`}</p>
                  <p className="mt-1 text-mute">{s.priceNote}</p>
                  {s.includes.length > 0 && (<><p className="mt-3 font-semibold">Comprend</p><ul className="mt-1 list-disc pl-5 text-graphite/85">{s.includes.map((x) => <li key={x}>{x}</li>)}</ul></>)}
                  {s.infoNeeded.length > 0 && (<><p className="mt-3 font-semibold">Utile à préparer</p><ul className="mt-1 list-disc pl-5 text-graphite/85">{s.infoNeeded.map((x) => <li key={x}>{x}</li>)}</ul></>)}
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <Field
        label={draft.unknownIssue ? 'Décrivez ce que vous constatez' : 'Précisions'}
        optional={!draft.unknownIssue}
        hint={draft.unknownIssue ? 'Bruit, voyant allumé, depuis quand, dans quelles conditions…' : 'Kilométrage, bruits, voyants, tout ce qui peut nous aider.'}
        error={errors.description}
      >
        <textarea className="input" value={draft.description} onChange={(e) => set({ description: e.target.value })} maxLength={2000} rows={4} name="description" />
      </Field>

      {needsVin && (
        <Field label="Numéro VIN" optional hint="17 caractères, case E de la carte grise. Il permet d’identifier la motorisation exacte." error={errors['vehicle.vin']}>
          <input className="input uppercase tracking-[0.08em]" value={draft.vehicle.vin} onChange={(e) => set({ vehicle: { ...draft.vehicle, vin: e.target.value.toUpperCase().replace(/\s/g, '') } })} maxLength={17} autoComplete="off" spellCheck={false} />
        </Field>
      )}

      <div>
        <p className="field-label">Photos <span className="font-normal text-mute">(facultatif, 5 maximum)</span></p>
        <p className="field-hint -mt-1 mb-3">Une photo du tableau de bord ou de la pièce concernée nous aide à préparer l’intervention.</p>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,.heic" multiple className="sr-only" id="photos" onChange={(e) => upload(e.target.files)} />
        <label htmlFor="photos" className={`btn btn-outline-dark cursor-pointer ${draft.attachments.length >= 5 ? 'pointer-events-none opacity-50' : ''}`}>
          {uploading ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-5" aria-hidden="true" />}
          Ajouter des photos
        </label>
        <div aria-live="polite">
          {uploadError && <p className="field-error">{uploadError}</p>}
          {draft.attachments.length > 0 && (
            <ul className="mt-3 space-y-2">
              {draft.attachments.map((a) => (
                <li key={a.id} className="flex min-h-[48px] items-center justify-between gap-3 rounded-sm border border-graphite/10 bg-white px-4">
                  <span className="truncate">{a.name} <span className="text-mute">· {Math.max(1, Math.round(a.size / 1024))} Ko</span></span>
                  <button type="button" className="inline-flex size-10 items-center justify-center" aria-label={`Retirer ${a.name}`} onClick={() => set({ attachments: draft.attachments.filter((x) => x.id !== a.id) })}><X className="size-5" aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {cfg.demoPrices && <Notice tone="demo">Les prix affichés sont des tarifs de démonstration, à valider par l’entreprise.</Notice>}
    </div>
  );
}
