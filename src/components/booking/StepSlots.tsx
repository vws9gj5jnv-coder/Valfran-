'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Check, Info } from 'lucide-react';
import { Field, Notice } from '@/components/ui/Field';
import type { Draft } from './types';
import type { Window } from '@/modules/availability/windows';

const dayFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' });
const shortFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'short' });
export const slotLabel = (iso: string, windows?: Window[]) => {
  const w = windows?.find((x) => x.startIso === iso);
  const d = dayFmt.format(new Date(iso));
  return w ? `${d.charAt(0).toUpperCase() + d.slice(1)}, ${w.label.toLowerCase()} (${w.start.replace(':', ' h ')} – ${w.end.replace(':', ' h ')})` : d;
};

export function StepSlots({ draft, set, errors, onWindows }: { draft: Draft; set: (p: Partial<Draft>) => void; errors: Record<string, string>; onWindows: (w: Window[]) => void }) {
  const [windows, setWindows] = useState<Window[] | null>(null);
  const [error, setError] = useState(false);
  const [week, setWeek] = useState(0);
  const services = draft.services.join(',');

  useEffect(() => {
    let alive = true;
    setError(false);
    fetch(`/api/slots?services=${encodeURIComponent(services)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (alive) { setWindows(d.windows); onWindows(d.windows); } })
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [services, onWindows]);

  const days = useMemo(() => {
    const map = new Map<string, Window[]>();
    for (const w of windows ?? []) map.set(w.date, [...(map.get(w.date) ?? []), w]);
    return [...map.entries()].filter(([, ws]) => ws.length > 0);
  }, [windows]);
  const weeks = useMemo(() => {
    const out: [string, Window[]][][] = [];
    for (let i = 0; i < days.length; i += 6) out.push(days.slice(i, i + 6));
    return out;
  }, [days]);

  const toggle = (iso: string) => {
    const has = draft.slots.includes(iso);
    if (has) set({ slots: draft.slots.filter((s) => s !== iso) });
    else if (draft.slots.length < 3) set({ slots: [...draft.slots, iso] });
  };

  return (
    <div className="space-y-6">
      <Notice tone="info" title="Demande de rendez-vous à confirmer">
        Choisissez jusqu’à trois créneaux qui vous conviennent. Nous vous recontactons pour fixer l’heure exacte : le rendez-vous n’est confirmé qu’après cet échange.
      </Notice>

      {error && <Notice tone="warn" role="alert" title="Impossible d’afficher les disponibilités">Vous pouvez continuer sans choisir de créneau et indiquer vos préférences ci-dessous : nous vous appellerons.</Notice>}
      {!windows && !error && <p className="flex items-center gap-2 text-mute"><Loader2 className="size-5 animate-spin" aria-hidden="true" /> Chargement des disponibilités…</p>}

      {windows && weeks.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <button type="button" className="btn btn-outline-dark btn-sm" disabled={week === 0} onClick={() => setWeek((w) => w - 1)}>← Plus tôt</button>
            <p className="text-center text-[0.9375rem] text-mute" aria-live="polite">
              {weeks[week]?.[0] && shortFmt.format(new Date(weeks[week][0][1][0].startIso))} – {weeks[week]?.at(-1) && shortFmt.format(new Date(weeks[week].at(-1)![1][0].startIso))}
            </p>
            <button type="button" className="btn btn-outline-dark btn-sm" disabled={week >= weeks.length - 1} onClick={() => setWeek((w) => w + 1)}>Plus tard →</button>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weeks[week]?.map(([date, ws]) => {
              const d = dayFmt.format(new Date(ws[0].startIso));
              return (
                <li key={date} className="rounded-sm border border-graphite/10 bg-white p-4">
                  <p className="font-semibold first-letter:uppercase">{d}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {ws.map((w) => {
                      const on = draft.slots.includes(w.startIso);
                      const full = !on && draft.slots.length >= 3;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          disabled={!w.available || full}
                          aria-pressed={on}
                          aria-label={`${d}, ${w.label}${w.available ? '' : ' : complet'}`}
                          onClick={() => toggle(w.startIso)}
                          className={`flex min-h-[56px] flex-col items-center justify-center rounded-sm border px-2 text-[0.9375rem] transition-colors ${on ? 'border-graphite bg-graphite text-paper' : w.available ? 'border-graphite/20 hover:border-graphite' : 'border-dashed border-graphite/15 text-graphite/35 line-through'} disabled:cursor-not-allowed`}
                        >
                          <span className="flex items-center gap-1 font-semibold">{on && <Check className="size-4" aria-hidden="true" />}{w.label}</span>
                          <span className={on ? 'text-paper/70' : 'text-mute'}>{w.start.replace(':', 'h')}–{w.end.replace(':', 'h')}</span>
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-[0.9375rem] text-mute" aria-live="polite">{draft.slots.length === 0 ? 'Aucun créneau choisi.' : `${draft.slots.length} créneau${draft.slots.length > 1 ? 'x' : ''} choisi${draft.slots.length > 1 ? 's' : ''} sur 3.`}</p>
        </div>
      )}
      {errors.preferredSlots && <p className="field-error" role="alert">{errors.preferredSlots}</p>}

      <Field label="Autres disponibilités ou contraintes" optional hint="Ex. : « plutôt en fin de semaine », « le véhicule est sur le parking de mon travail ».">
        <textarea className="input" rows={3} value={draft.availabilityNote} onChange={(e) => set({ availabilityNote: e.target.value })} maxLength={500} />
      </Field>
      <p className="flex items-start gap-2 text-[0.9375rem] text-mute"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Aucun créneau ne convient ? Continuez sans en choisir : nous vous proposerons une date par téléphone.</p>
    </div>
  );
}
