import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Fuel, Gauge, Cog, Zap, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useGarage } from '../store/garageStore';

const Row = ({ icon: I, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl bg-ink-900/70 p-3">
    <I size={18} className="shrink-0 text-volt-400" />
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-chrome-500">{label}</div>
      <div className="truncate text-sm font-medium text-chrome-100">{value}</div>
    </div>
  </div>
);

export default function StepVehicle() {
  const { state, dispatch } = useGarage();
  const v = state.vehicle;
  if (!v) return null;
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-emerald-400">
        <CheckCircle2 size={18} /> Véhicule identifié
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative mt-4 overflow-hidden rounded-2xl border border-ink-500 bg-gradient-to-br from-ink-700 to-ink-900 p-5 sm:p-6"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-volt-500/10 blur-3xl" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-chrome-500">{v.brand}</div>
            <h3 className="text-2xl font-bold sm:text-3xl">{v.model}</h3>
            <p className="mt-1 text-sm text-chrome-400">{v.engine} · {v.category}</p>
          </div>
          <span className="rounded-md border-2 border-ink-950 bg-white px-2.5 py-1 font-plate text-lg font-bold tracking-wider text-ink-950">{v.plate}</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Row icon={Calendar} label="Mise en circulation" value={v.firstRegistration} />
          <Row icon={Fuel} label="Carburant" value={v.fuel} />
          <Row icon={Zap} label="Puissance" value={v.power} />
          <Row icon={Cog} label="Boîte" value={v.gearbox} />
          <Row icon={Gauge} label="Kilométrage estimé" value={`≈ ${v.mileage.toLocaleString('fr-FR')} km`} />
          <Row icon={Calendar} label="Année" value={v.year} />
        </div>
      </motion.div>
      <p className="mt-3 text-xs text-chrome-500">Données de démonstration simulées — le kilométrage est une estimation à confirmer sur place.</p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button className="btn-ghost" onClick={() => dispatch({ type: 'GO', step: 1 })}>
          <RotateCcw size={16} /> Ce n'est pas mon véhicule
        </button>
        <button className="btn-primary" onClick={() => dispatch({ type: 'GO', step: 3 })}>
          C'est bien le mien <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
