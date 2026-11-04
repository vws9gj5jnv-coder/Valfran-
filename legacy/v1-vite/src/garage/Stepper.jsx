import { Check } from 'lucide-react';
import { STEPS, useGarage } from '../store/garageStore';

export default function Stepper() {
  const { state, dispatch } = useGarage();
  const maxReached = state.confirmation ? 5 : state.step;
  return (
    <ol className="flex items-center gap-1 sm:gap-2" aria-label="Progression">
      {STEPS.map((s, i) => {
        const done = s.id < state.step || state.confirmation;
        const active = s.id === state.step && !state.confirmation;
        const clickable = done && !state.confirmation && s.id < maxReached;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-1 sm:gap-2" aria-current={active ? 'step' : undefined}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => dispatch({ type: 'GO', step: s.id })}
              className="group flex items-center gap-2 disabled:cursor-default"
              aria-label={`Étape ${s.id} : ${s.label}`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                  done ? 'bg-volt-500 text-white' : active ? 'bg-ember-500 text-ink-950 shadow-ember' : 'bg-ink-600 text-chrome-500'
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : s.id}
              </span>
              <span className={`hidden text-xs font-medium lg:block ${active ? 'text-chrome-100' : 'text-chrome-500'}`}>{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <span className={`h-px flex-1 ${done ? 'bg-volt-500/60' : 'bg-ink-600'}`} />}
          </li>
        );
      })}
    </ol>
  );
}
