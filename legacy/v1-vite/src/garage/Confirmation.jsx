import { motion } from 'framer-motion';
import { Check, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGarage } from '../store/garageStore';
import { BUSINESS } from '../data/business';
import { eur } from '../lib/pricing';

export default function Confirmation() {
  const { state, dispatch, quote } = useGarage();
  const date = new Date(state.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-ink-950">
        <Check size={34} strokeWidth={3} />
      </motion.div>
      <h3 className="mt-5 text-2xl font-bold sm:text-3xl">Demande envoyée !</h3>
      <p className="mt-2 text-chrome-300">Référence <strong className="text-chrome-100">{state.confirmation.ref}</strong> — je vous confirme le rendez-vous par téléphone ou e-mail sous 2 h ouvrées.</p>
      <div className="card mx-auto mt-6 max-w-md space-y-2 p-5 text-left text-sm">
        <div className="flex justify-between"><span className="text-chrome-400">Véhicule</span><span>{state.vehicle.brand} {state.vehicle.model}</span></div>
        <div className="flex justify-between"><span className="text-chrome-400">Intervention</span><span>{quote.service.label}</span></div>
        <div className="flex justify-between"><span className="text-chrome-400">Quand</span><span className="capitalize">{date} · {state.slot}</span></div>
        <div className="flex justify-between gap-4"><span className="shrink-0 text-chrome-400">Où</span><span className="text-right">{state.address}</span></div>
        <div className="flex justify-between border-t border-ink-600 pt-2"><span className="text-chrome-400">Estimation</span><span className="font-semibold text-ember-400">{eur(quote.min)} – {eur(quote.max)}</span></div>
      </div>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <a href={BUSINESS.phoneHref} className="btn-ghost"><Phone size={16} /> {BUSINESS.phone}</a>
        <Link to="/vehicules" className="btn-secondary" onClick={() => dispatch({ type: 'RESET' })}>Voir les véhicules d'occasion</Link>
        <button className="btn-ghost" onClick={() => dispatch({ type: 'RESET' })}>Nouvelle demande</button>
      </div>
    </div>
  );
}
