'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Field, Notice } from '@/components/ui/Field';
import type { Draft, AddressState, WizardConfig } from './types';
import { euros } from '@/lib/text';

type Suggestion = { label: string; postcode: string; city: string };

export function StepAddress({ draft, update, cfg, errors, requirements }: {
  draft: Draft; update: (p: Partial<AddressState>) => void; cfg: WizardConfig; errors: Record<string, string>; requirements: string[];
}) {
  const a = draft.address;
  const [query, setQuery] = useState(a.postcode || a.city ? `${a.postcode} ${a.city}`.trim() : '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [checking, setChecking] = useState(false);
  const [netError, setNetError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = 'commune-suggestions';

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function onQuery(q: string) {
    setQuery(q);
    update({ postcode: '', city: '', check: null });
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) { setSuggestions([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const seen = new Set<string>();
        setSuggestions((data.results ?? []).filter((r: Suggestion) => { const k = r.postcode + r.city; if (seen.has(k)) return false; seen.add(k); return true; }));
        setActiveIdx(-1);
      } catch { setSuggestions([]); }
    }, 220);
  }

  async function pick(s: Suggestion) {
    setQuery(`${s.postcode} ${s.city}`);
    setSuggestions([]);
    update({ postcode: s.postcode, city: s.city, check: null });
    await check(s.postcode, s.city);
  }

  async function check(postcode: string, city: string) {
    setChecking(true);
    setNetError(false);
    try {
      const res = await fetch('/api/address/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ street: a.street, postcode, city }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      update({ postcode, city, check: data });
    } catch {
      setNetError(true);
    } finally {
      setChecking(false);
    }
  }

  // Saisie manuelle « 88200 Remiremont » sans choisir de suggestion
  function onBlurQuery() {
    setTimeout(() => {
      if (a.postcode) return;
      const m = query.match(/^\s*(\d{5})\s+(.+?)\s*$/);
      if (m) { update({ postcode: m[1], city: m[2], check: null }); check(m[1], m[2]); }
    }, 150);
  }

  const c = a.check;
  return (
    <div className="space-y-6">
      <Field label="Numéro et rue" hint="Là où se trouvera le véhicule le jour de l’intervention." error={errors['address.street']}>
        <input className="input" value={a.street} onChange={(e) => update({ street: e.target.value })} autoComplete="street-address" name="street" maxLength={200} placeholder="Ex. : 12 rue des Écoles" />
      </Field>

      <div className="relative">
        <Field label="Code postal ou commune" hint="Commencez à taper, puis choisissez dans la liste." error={errors['address.postcode'] || errors['address.city']}>
          <input
            className="input"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onBlur={onBlurQuery}
            onKeyDown={(e) => {
              if (!suggestions.length) return;
              if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(suggestions.length - 1, i + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
              if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pick(suggestions[activeIdx]); }
              if (e.key === 'Escape') setSuggestions([]);
            }}
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
            autoComplete="off"
            name="commune"
            placeholder="Ex. : 88200 ou Remiremont"
          />
        </Field>
        {suggestions.length > 0 && (
          <ul id={listId} role="listbox" className="absolute inset-x-0 z-20 mt-1 max-h-72 overflow-auto rounded-sm border border-graphite/20 bg-white shadow-[0_12px_32px_-12px_rgba(17,18,22,0.25)]" style={{ top: 'calc(100% - 1.6rem)' }}>
            {suggestions.map((s, i) => (
              <li
                key={s.postcode + s.city}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIdx}
                onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                className={`flex min-h-[52px] cursor-pointer items-center gap-3 px-4 ${i === activeIdx ? 'bg-paper' : 'hover:bg-paper'}`}
              >
                <MapPin className="size-4 text-mute" aria-hidden="true" /> {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div aria-live="polite">
        {checking && <p className="flex items-center gap-2 text-mute"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Vérification de la zone…</p>}
        {netError && <Notice tone="warn" role="alert" title="Vérification impossible pour le moment">Vous pouvez continuer : nous vérifierons le déplacement avec vous. <button type="button" className="link-u font-semibold" onClick={() => check(a.postcode, a.city)}>Réessayer</button></Notice>}
        {c && !checking && (
          <div className={`card flex items-start gap-4 p-5 ${c.status === 'outside' ? 'border-danger/40' : ''}`}>
            {c.status === 'served' ? <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-ok" aria-hidden="true" /> : c.status === 'outside' ? <XCircle className="mt-0.5 size-6 shrink-0 text-danger" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 size-6 shrink-0 text-warn" aria-hidden="true" />}
            <div>
              <p className="font-semibold">{c.status === 'served' ? `${a.city} : dans notre secteur` : c.status === 'outside' ? 'Hors zone d’intervention' : 'Déplacement à confirmer'}</p>
              <p className="mt-1 text-graphite/85">{c.message}</p>
              {c.status === 'served' && c.feeCents !== null && (
                <p className="mt-2 text-[0.9375rem] text-mute">
                  Déplacement : <strong className="text-graphite">{c.feeCents === 0 ? 'offert' : euros(c.feeCents)}</strong>
                  {c.distanceKm !== null && <> · environ {c.distanceKm} km depuis {cfg.baseName}</>}
                  {cfg.demoPrices && ' · tarif démo'}
                </p>
              )}
              {c.status === 'outside' && <p className="mt-2">Appelez-nous au <a className="link-u font-semibold" href={cfg.phoneHref}>{cfg.phone}</a> : nous pourrons peut-être vous orienter.</p>}
            </div>
          </div>
        )}
      </div>

      {requirements.length > 0 && (
        <div className="rounded-sm border border-graphite/10 bg-paper p-5">
          <p className="font-semibold">Pour que l’intervention soit possible</p>
          <ul className="mt-2 space-y-1.5 text-graphite/85">
            {requirements.map((r) => <li key={r} className="flex gap-3"><span className="mt-2.5 h-px w-3 shrink-0 bg-champagne" aria-hidden="true" />{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
