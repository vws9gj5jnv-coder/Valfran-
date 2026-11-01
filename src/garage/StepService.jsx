import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Icon from '../components/Icon';
import { SERVICES } from '../data/services';
import { useGarage } from '../store/garageStore';
import { isApplicable } from '../lib/pricing';

export default function StepService() {
  const { state, dispatch } = useGarage();
  return (
    <div>
      <h3 className="text-2xl font-bold">Que doit-on faire sur votre {state.vehicle?.model} ?</h3>
      <p className="mt-2 text-sm text-chrome-400">Sélectionnez l'intervention souhaitée.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3" role="radiogroup" aria-label="Intervention">
        {SERVICES.map((s) => {
          const ok = isApplicable(s, state.vehicle);
          const sel = state.serviceId === s.id;
          return (
            <motion.button
              key={s.id} type="button" role="radio" aria-checked={sel} disabled={!ok}
              whileHover={ok ? { y: -3 } : undefined} whileTap={ok ? { scale: 0.97 } : undefined}
              title={!ok ? s.notFor.reason : undefined}
              onClick={() => dispatch({ type: 'SELECT_SERVICE', id: s.id })}
              className={`relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition ${
                sel ? 'border-ember-500 bg-ember-500/10 shadow-ember' : 'border-ink-500 bg-ink-800 hover:border-chrome-500'
              } ${!ok ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              {sel && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-ember-500 text-ink-950"><Check size={12} strokeWidth={3} /></span>}
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${sel ? 'bg-ember-500 text-ink-950' : 'bg-ink-600 text-volt-400'}`}>
                <Icon name={s.icon} size={22} />
              </span>
              <span className="text-sm font-semibold leading-tight text-chrome-100">{s.label}</span>
              {!ok && <span className="text-[11px] leading-tight text-chrome-500">Non applicable</span>}
            </motion.button>
          );
        })}
      </div>

      {state.serviceId === 'autre' && (
        <div className="mt-4">
          <label className="label" htmlFor="other-note">Décrivez votre besoin</label>
          <textarea id="other-note" rows={3} className="field" placeholder="Ex. : bruit au démarrage, remplacement de la batterie…"
            value={state.otherNote} onChange={(e) => dispatch({ type: 'SET', patch: { otherNote: e.target.value } })} />
        </div>
      )}

      <div className="mt-6 flex justify-between gap-3">
        <button className="btn-ghost" onClick={() => dispatch({ type: 'GO', step: 2 })}><ArrowLeft size={16} /> Retour</button>
        <button className="btn-primary" disabled={!state.serviceId} onClick={() => dispatch({ type: 'GO', step: 4 })}>
          Voir mon estimation <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
