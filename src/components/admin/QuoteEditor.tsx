'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, ArrowUp } from 'lucide-react';
import { ActionForm } from './ActionForm';
import { saveQuote } from '@/modules/admin/quotes-actions';
import { computeTotals, LINE_KINDS } from '@/modules/quotes/totals';
import { euros } from '@/lib/text';

type Line = { kind: string; label: string; reference: string; quantity: number; unitPriceHtCents: number; vatRate: number };

export function QuoteEditor({ quote, initialLines, locked }: {
  quote: { id: string; title: string; vehicleLabel: string; notes: string; validUntil: string; vatMode: 'franchise' | 'normal' };
  initialLines: Line[]; locked: boolean;
}) {
  const [head, setHead] = useState(quote);
  const [lines, setLines] = useState<Line[]>(initialLines);
  const totals = useMemo(() => computeTotals(lines, head.vatMode), [lines, head.vatMode]);
  const upd = (i: number, p: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...p } : l)));
  const payload = JSON.stringify({ ...head, lines });
  return (
    <ActionForm action={saveQuote} submitLabel="Enregistrer le devis" hideSubmit={locked}>
      <input type="hidden" name="payload" value={payload} />
      <fieldset disabled={locked} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="field-label" htmlFor="q-title">Objet</label><input id="q-title" className="input" value={head.title} onChange={(e) => setHead({ ...head, title: e.target.value })} /></div>
          <div><label className="field-label" htmlFor="q-veh">Véhicule</label><input id="q-veh" className="input" value={head.vehicleLabel} onChange={(e) => setHead({ ...head, vehicleLabel: e.target.value })} /></div>
          <div><label className="field-label" htmlFor="q-valid">Valable jusqu’au</label><input id="q-valid" type="date" className="input" value={head.validUntil} onChange={(e) => setHead({ ...head, validUntil: e.target.value })} /></div>
          <div><label className="field-label" htmlFor="q-vat">Régime de TVA</label><select id="q-vat" className="input" value={head.vatMode} onChange={(e) => setHead({ ...head, vatMode: e.target.value as 'franchise' | 'normal' })}><option value="franchise">Franchise en base (art. 293 B du CGI)</option><option value="normal">TVA applicable</option></select></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-[0.9375rem]">
            <thead className="text-[0.8125rem] text-mute"><tr><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium">Désignation</th><th className="pb-2 font-medium">Référence</th><th className="pb-2 font-medium">Qté</th><th className="pb-2 font-medium">PU HT (€)</th>{head.vatMode === 'normal' && <th className="pb-2 font-medium">TVA %</th>}<th className="pb-2 text-right font-medium">Total HT</th><th /></tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="align-top">
                  <td className="py-1 pr-2"><select aria-label="Type" className="input min-h-[44px] w-36 px-2 text-[0.9375rem]" value={l.kind} onChange={(e) => upd(i, { kind: e.target.value })}>{Object.entries(LINE_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                  <td className="py-1 pr-2"><input aria-label="Désignation" className="input min-h-[44px] text-[0.9375rem]" value={l.label} onChange={(e) => upd(i, { label: e.target.value })} required /></td>
                  <td className="py-1 pr-2"><input aria-label="Référence" className="input min-h-[44px] w-32 text-[0.9375rem]" value={l.reference} onChange={(e) => upd(i, { reference: e.target.value })} placeholder="—" /></td>
                  <td className="py-1 pr-2"><input aria-label="Quantité" type="number" step="0.25" min="0" className="input min-h-[44px] w-20 text-[0.9375rem]" value={l.quantity} onChange={(e) => upd(i, { quantity: Number(e.target.value) })} /></td>
                  <td className="py-1 pr-2"><input aria-label="Prix unitaire HT" type="number" step="0.01" className="input min-h-[44px] w-28 text-[0.9375rem]" value={l.unitPriceHtCents / 100} onChange={(e) => upd(i, { unitPriceHtCents: Math.round(Number(e.target.value) * 100) })} /></td>
                  {head.vatMode === 'normal' && <td className="py-1 pr-2"><input aria-label="TVA" type="number" step="0.1" className="input min-h-[44px] w-20 text-[0.9375rem]" value={l.vatRate} onChange={(e) => upd(i, { vatRate: Number(e.target.value) })} /></td>}
                  <td className="whitespace-nowrap py-3 pr-2 text-right tabular-nums">{euros(Math.round(l.quantity * l.unitPriceHtCents), { decimals: true })}</td>
                  <td className="py-1 whitespace-nowrap">
                    {i > 0 && <button type="button" className="inline-flex size-10 items-center justify-center text-mute hover:text-graphite" aria-label="Monter la ligne" onClick={() => setLines((ls) => { const c = [...ls]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c; })}><ArrowUp className="size-4" aria-hidden="true" /></button>}
                    <button type="button" className="inline-flex size-10 items-center justify-center text-mute hover:text-danger" aria-label="Supprimer la ligne" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><Trash2 className="size-4" aria-hidden="true" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LINE_KINDS).map(([k, v]) => <button key={k} type="button" className="btn btn-outline-dark btn-sm" onClick={() => setLines((ls) => [...ls, { kind: k, label: k === 'piece' ? '' : v, reference: '', quantity: 1, unitPriceHtCents: 0, vatRate: 20 }])}><Plus className="size-4" aria-hidden="true" />{v}</button>)}
        </div>
        <dl className="ml-auto w-full max-w-xs space-y-1 border-t border-graphite/10 pt-3 tabular-nums">
          <div className="flex justify-between"><dt>Total HT</dt><dd>{euros(totals.totalHtCents, { decimals: true })}</dd></div>
          {head.vatMode === 'normal' && <div className="flex justify-between"><dt>TVA</dt><dd>{euros(totals.totalVatCents, { decimals: true })}</dd></div>}
          <div className="flex justify-between text-[1.125rem] font-semibold"><dt>{head.vatMode === 'normal' ? 'Total TTC' : 'Total'}</dt><dd>{euros(totals.totalTtcCents, { decimals: true })}</dd></div>
        </dl>
        <div><label className="field-label" htmlFor="q-notes">Notes affichées sur le devis</label><textarea id="q-notes" className="input" rows={3} value={head.notes} onChange={(e) => setHead({ ...head, notes: e.target.value })} /></div>
        <p className="text-[0.875rem] text-mute">Les références et prix des pièces sont à saisir à partir de vos fournisseurs : aucune référence n’est générée automatiquement.</p>
      </fieldset>
    </ActionForm>
  );
}
