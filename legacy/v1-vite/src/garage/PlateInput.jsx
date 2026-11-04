import { useId } from 'react';
import { formatPlate } from '../lib/vehicleLookup';

/** Champ de saisie stylisé "plaque d'immatriculation française" (SIV). */
export default function PlateInput({ value, onChange, onSubmit, invalid, disabled }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="sr-only">Plaque d'immatriculation</label>
      <div
        className={`flex h-[72px] sm:h-20 w-full max-w-md overflow-hidden rounded-xl border-2 bg-white shadow-[0_8px_30px_-8px_rgba(0,0,0,.6)] transition ${
          invalid ? 'border-red-500' : 'border-ink-950 focus-within:ring-4 focus-within:ring-volt-500/50'
        }`}
      >
        <div className="flex w-11 sm:w-12 shrink-0 flex-col items-center justify-center gap-0.5 bg-[#0b3d9e] text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return <circle key={i} cx={(12 + 8.5 * Math.sin(a)).toFixed(2)} cy={(12 - 8.5 * Math.cos(a)).toFixed(2)} r="1.3" fill="#fc0" />;
            })}
          </svg>
          <span className="font-plate text-lg font-bold leading-none">F</span>
        </div>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(formatPlate(e.target.value))}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
          placeholder="AA-123-AA"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={9}
          disabled={disabled}
          aria-invalid={invalid}
          className="min-w-0 flex-1 bg-transparent text-center font-plate text-[40px] sm:text-5xl font-bold uppercase tracking-[.08em] text-ink-950 placeholder:text-neutral-300 focus:outline-none"
        />
        <div className="flex w-11 sm:w-12 shrink-0 flex-col items-center justify-end bg-[#0b3d9e] pb-1.5 text-white">
          <span className="font-plate text-lg font-bold leading-none">70</span>
        </div>
      </div>
    </div>
  );
}
