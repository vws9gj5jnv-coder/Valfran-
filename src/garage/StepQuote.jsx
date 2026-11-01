import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, Info } from 'lucide-react';
import { useGarage } from '../store/garageStore';
import { CITIES } from '../data/zones';
import QuoteBreakdown from './QuoteBreakdown';
import { eur } from '../lib/pricing';

export default function StepQuote() {
  const { state, dispatch, quote } = useGarage();
  if (!quote) return null;
  const { service } = quote;
  return (
    <div>
      <h3 className="text-2xl font-bold">Votre estimation instantanée</h3>
      <p className="mt-2 text-sm text-chrome-400">{service.label} · {state.vehicle.brand} {state.vehicle.model}</p>

      {service.addons.length > 0 && (
        <fieldset className="mt-5">
          <legend className="label">Options (facultatif)</legend>
          <div className="flex flex-wrap gap-2">
            {service.addons.map((a) => {
              const on = state.addons.includes(a.id);
              return (
                <motion.button key={a.id} type="button" whileTap={{ scale: 0.95 }} aria-pressed={on}
                  onClick={() => dispatch({ type: 'TOGGLE_ADDON', id: a.id })}
                  className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                    on ? 'border-volt-500 bg-volt-500/15 text-chrome-100' : 'border-ink-500 text-chrome-300 hover:border-chrome-400'
                  }`}>
                  {on ? '✓ ' : '+ '}{a.label}{a.price > 0 && ` · ${eur(a.price)}`}
                </motion.button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-5">
        <label className="label" htmlFor="city"><MapPin size={12} className="mr-1 inline" />Commune d'intervention (km · déplacement)</label>
        <select id="city" className="field" value={state.cityId}
          onChange={(e) => dispatch({ type: 'SET', patch: { cityId: e.target.value } })}>
          <option value="">Sélectionnez votre commune…</option>
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.dept}) · {c.km} km · {eur(c.fee)}</option>
          ))}
        </select>
        <p className="mt-2 flex gap-1.5 text-xs text-chrome-500">
          <Info size={14} className="mt-px shrink-0" />
          Votre commune n'est pas listée ? Choisissez la plus proche, le tarif exact vous sera confirmé.
        </p>
      </div>

      <div className="mt-5"><QuoteBreakdown quote={quote} /></div>
      <p className="mt-3 text-xs text-chrome-500">Estimation indicative non contractuelle. Un devis ferme est confirmé avant toute intervention.</p>

      <div className="mt-6 flex justify-between gap-3">
        <button className="btn-ghost" onClick={() => dispatch({ type: 'GO', step: 3 })}><ArrowLeft size={16} /> Retour</button>
        <button className="btn-primary" disabled={!state.cityId} onClick={() => dispatch({ type: 'GO', step: 5 })}>
          Prendre rendez-vous <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
