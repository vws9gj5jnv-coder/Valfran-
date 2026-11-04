import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGarage } from '../store/garageStore';
import Stepper from './Stepper';
import StepPlate from './StepPlate';
import StepVehicle from './StepVehicle';
import StepService from './StepService';
import StepQuote from './StepQuote';
import StepBooking from './StepBooking';
import Confirmation from './Confirmation';
import QuoteBreakdown from './QuoteBreakdown';

const VIEWS = { 1: StepPlate, 2: StepVehicle, 3: StepService, 4: StepQuote, 5: StepBooking };

/**
 * Module "Garage Virtuel Valfran".
 * @param {boolean} showSummary affiche le récapitulatif de prix en direct (colonne latérale desktop)
 */
export default function GarageVirtuel({ showSummary = false, id }) {
  const { state, quote } = useGarage();
  const View = state.confirmation ? Confirmation : VIEWS[state.step];
  const top = useRef(null);
  const first = useRef(true);

  // Recentre le module quand l'étape change (mobile)
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [state.step, state.confirmation]);

  const showAside = showSummary && quote && state.step >= 3 && !state.confirmation;

  return (
    <div id={id} ref={top} className="scroll-mt-24">
      <div className={`grid gap-6 ${showAside ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
        <div className="card relative overflow-hidden p-5 sm:p-8 shadow-2xl shadow-black/40">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-volt-500/60 to-transparent" />
          {!state.confirmation && <div className="mb-7"><Stepper /></div>}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={state.confirmation ? 'ok' : state.step}
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}>
              <View />
            </motion.div>
          </AnimatePresence>
        </div>
        {showAside && (
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-chrome-500">Récapitulatif</div>
              <QuoteBreakdown quote={quote} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
