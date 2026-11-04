'use client';

import { useState } from 'react';
import { Search, Loader2, CheckCircle2, CarFront, ArrowRight } from 'lucide-react';
import { Field, Notice } from '@/components/ui/Field';
import type { Draft, VehicleState, WizardConfig } from './types';
import type { PlateLookupResult, IdentifiedVehicle } from '@/modules/plates/types';
import { normalizePlate } from '@/modules/plates/plate';

const describe = (v: IdentifiedVehicle) => [v.make, v.model, v.version, v.engine].filter(Boolean).join(' ');

export function StepVehicle({ draft, update, cfg, errors }: {
  draft: Draft; update: (p: Partial<VehicleState>) => void; cfg: WizardConfig; errors: Record<string, string>;
}) {
  const v = draft.vehicle;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlateLookupResult | null>(null);
  const [netError, setNetError] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function identify() {
    setLocalError(null);
    setNetError(false);
    const check = normalizePlate(v.plate);
    if (!check.ok) { setLocalError(check.reason); return; }
    update({ plate: check.normalized, identified: null });
    setLoading(true);
    try {
      const res = await fetch('/api/vehicle/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plate: check.normalized }) });
      const data = (await res.json()) as PlateLookupResult;
      setResult(data);
      if (data.status === 'found' && data.vehicles.length === 1) choose(data.vehicles[0]);
    } catch {
      setNetError(true);
    } finally {
      setLoading(false);
    }
  }

  function choose(iv: IdentifiedVehicle) {
    update({ source: 'plate', identified: iv, make: iv.make, model: iv.model, year: iv.year ?? null, fuel: iv.fuel ?? '', engine: iv.engine ?? '' });
  }

  function goManual() {
    update({ source: 'manual', identified: null });
  }

  const models = v.make && cfg.makes[v.make] ? cfg.makes[v.make] : [];
  const thisYear = new Date().getFullYear();

  return (
    <div className="space-y-8">
      <div role="tablist" aria-label="Méthode d’identification" className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-graphite/15 bg-graphite/15">
        {([['plate', 'Avec la plaque'], ['manual', 'Choisir manuellement']] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={v.source === k}
            onClick={() => update({ source: k, ...(k === 'manual' ? { identified: null } : {}) })}
            className={`min-h-[56px] px-4 text-[1rem] font-semibold transition-colors ${v.source === k ? 'bg-graphite text-paper' : 'bg-white text-graphite hover:bg-paper'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {v.source === 'plate' && (
        <div className="space-y-6" role="tabpanel">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Numéro d’immatriculation" hint="Exemple : AB-123-CD. Il figure sur la carte grise (case A)." error={localError ?? errors['vehicle.plate']}>
              <input
                className="input text-center text-[1.375rem] font-semibold uppercase tracking-[0.12em] tabular-nums sm:text-left"
                value={v.plate}
                onChange={(e) => { update({ plate: e.target.value.toUpperCase(), identified: null }); setResult(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); identify(); } }}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                inputMode="text"
                maxLength={12}
                placeholder="AB-123-CD"
                name="plate"
              />
            </Field>
            <button type="button" onClick={identify} className="btn btn-dark sm:mb-[1.85rem]" disabled={loading || v.plate.trim().length < 5}>
              {loading ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
              Identifier mon véhicule
            </button>
          </div>

          <div aria-live="polite" className="space-y-4">
            {loading && <p className="text-mute">Recherche en cours…</p>}
            {netError && (
              <Notice tone="warn" title="Connexion interrompue" role="alert">
                La recherche n’a pas abouti. Vérifiez votre connexion et réessayez, ou <button type="button" className="link-u font-semibold" onClick={goManual}>choisissez votre véhicule manuellement</button>.
              </Notice>
            )}
            {result?.status === 'found' && result.vehicles.length > 1 && !v.identified && (
              <fieldset className="space-y-3">
                <legend className="field-label">Plusieurs versions correspondent. Laquelle est la vôtre ?</legend>
                {result.vehicles.map((iv, i) => (
                  <button key={i} type="button" onClick={() => choose(iv)} className="card flex min-h-[64px] w-full items-center justify-between gap-4 px-5 text-left hover:border-graphite">
                    <span><span className="block font-semibold">{describe(iv)}</span><span className="text-[0.9375rem] text-mute">{[iv.fuel, iv.year].filter(Boolean).join(' · ')}</span></span>
                    <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
                  </button>
                ))}
                <p className="field-hint">Vous ne savez pas ? Choisissez la première : nous vérifierons ensemble.</p>
              </fieldset>
            )}
            {v.identified && (
              <div className="card flex items-start gap-4 p-5">
                <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-ok" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-semibold">Véhicule identifié</p>
                  <p className="mt-1 text-[1.125rem]">{describe(v.identified)}</p>
                  <p className="text-mute">{[v.identified.fuel, v.identified.year].filter(Boolean).join(' · ')}</p>
                  {result?.status === 'found' && result.demo && <p className="mt-2 text-[0.875rem] text-champagne-ink">Résultat simulé (mode démonstration).</p>}
                  <div className="mt-3 flex flex-wrap gap-x-6">
                    <button type="button" className="inline-flex min-h-[44px] items-center font-semibold link-u" onClick={goManual}>Ce n’est pas mon véhicule</button>
                    <a href={`/garage-virtuel?categorie=${v.identified.category}&vehicule=${encodeURIComponent(describe(v.identified))}`} className="inline-flex min-h-[44px] items-center text-mute link-u">Explorer dans le garage virtuel (facultatif)</a>
                  </div>
                </div>
              </div>
            )}
            {result && result.status !== 'found' && (
              <Notice tone={result.status === 'invalid' ? 'danger' : 'warn'} role="alert" title={{
                not_found: 'Véhicule introuvable',
                invalid: 'Plaque non valide',
                unavailable: 'Service d’identification indisponible',
                quota: 'Service d’identification momentanément saturé',
                rate_limited: 'Trop de recherches',
                disabled: 'Identification par plaque non disponible',
              }[result.status]}>
                <p>
                  {result.status === 'invalid' ? result.reason
                    : result.status === 'not_found' ? 'Aucun véhicule ne correspond à cette plaque chez notre fournisseur.'
                      : result.status === 'rate_limited' ? 'Vous avez effectué plusieurs recherches. Pas d’inquiétude : '
                        : 'Ce n’est pas grave : '}
                  {result.status !== 'invalid' && <> <button type="button" className="font-semibold link-u" onClick={goManual}>choisissez votre véhicule manuellement</button>, cela prend 30 secondes.</>}
                </p>
              </Notice>
            )}
          </div>

          {cfg.demo && (
            <Notice tone="demo" title="Mode démonstration">
              <p>Aucun fournisseur d’identification n’est connecté. Plaques d’essai :</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {cfg.demoPlates.map((p) => (
                  <li key={p}><button type="button" className="badge min-h-[36px] border border-graphite/20 bg-white px-3 font-mono" onClick={() => { update({ plate: p, identified: null }); setResult(null); }}>{p}</button></li>
                ))}
              </ul>
            </Notice>
          )}
        </div>
      )}

      {v.source === 'manual' && (
        <div className="grid gap-6 sm:grid-cols-2" role="tabpanel">
          {v.plate && <p className="sm:col-span-2 text-mute">Plaque conservée : <strong className="text-graphite">{v.plate}</strong></p>}
          <Field label="Marque" error={errors['vehicle.make']}>
            <select className="input" value={cfg.makes[v.make] || !v.make ? v.make : '__autre'} onChange={(e) => update({ make: e.target.value === '__autre' ? ' ' : e.target.value, model: '' })} name="make" autoComplete="off">
              <option value="">Choisir…</option>
              {Object.keys(cfg.makes).sort((a, b) => a.localeCompare(b, 'fr')).map((m) => <option key={m} value={m}>{m}</option>)}
              <option value="__autre">Autre marque</option>
            </select>
          </Field>
          {v.make && !cfg.makes[v.make] && (
            <Field label="Nom de la marque" error={errors['vehicle.make']}>
              <input className="input" value={v.make.trim()} onChange={(e) => update({ make: e.target.value || ' ' })} maxLength={40} autoComplete="off" />
            </Field>
          )}
          <Field label="Modèle" error={errors['vehicle.model']}>
            {models.length > 0 ? (
              <select className="input" value={models.includes(v.model) || !v.model ? v.model : '__autre'} onChange={(e) => update({ model: e.target.value === '__autre' ? ' ' : e.target.value })} name="model">
                <option value="">Choisir…</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
                <option value="__autre">Autre modèle</option>
              </select>
            ) : (
              <input className="input" value={v.model.trim()} onChange={(e) => update({ model: e.target.value })} maxLength={60} placeholder="Ex. : Clio" disabled={!v.make} />
            )}
          </Field>
          {models.length > 0 && v.model && !models.includes(v.model) && (
            <Field label="Nom du modèle">
              <input className="input" value={v.model.trim()} onChange={(e) => update({ model: e.target.value || ' ' })} maxLength={60} />
            </Field>
          )}
          <Field label="Année" optional hint="Date de première mise en circulation (case B de la carte grise).">
            <select className="input" value={v.year ?? ''} onChange={(e) => update({ year: e.target.value ? Number(e.target.value) : null })} name="year">
              <option value="">Je ne sais pas</option>
              {Array.from({ length: thisYear - 1989 }, (_, i) => thisYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Carburant" optional>
            <select className="input" value={v.fuel} onChange={(e) => update({ fuel: e.target.value })} name="fuel">
              <option value="">Je ne sais pas</option>
              {cfg.fuels.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Motorisation" optional hint="Si vous la connaissez, par exemple « 1.5 dCi 90 »." className="sm:col-span-2">
            <input className="input" value={v.engine} onChange={(e) => update({ engine: e.target.value })} maxLength={80} autoComplete="off" />
          </Field>
        </div>
      )}

      <p className="flex items-start gap-3 text-[0.9375rem] text-mute">
        <CarFront className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        Ces informations servent uniquement à préparer l’intervention (pièces, outillage, durée).
      </p>
    </div>
  );
}
