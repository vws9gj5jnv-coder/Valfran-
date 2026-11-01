import { useState } from 'react';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import PlateInput from './PlateInput';
import { useGarage } from '../store/garageStore';
import { isValidPlate, lookupPlate } from '../lib/vehicleLookup';

const EXAMPLES = ['AB-123-CD', 'FT-482-KM', 'GH-907-PL'];

export default function StepPlate() {
  const { state, dispatch } = useGarage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async (plate = state.plate) => {
    if (!isValidPlate(plate)) return setError('Format invalide. Exemple : AB-123-CD (lettres I, O et U non utilisées).');
    setError('');
    setLoading(true);
    try {
      const vehicle = await lookupPlate(plate);
      dispatch({ type: 'SET_VEHICLE', vehicle });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold">Quelle est votre plaque ?</h3>
      <p className="mt-2 text-sm text-chrome-400">Nous identifions automatiquement votre véhicule pour un devis précis.</p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <PlateInput
          value={state.plate}
          onChange={(plate) => { dispatch({ type: 'SET_PLATE', plate }); setError(''); }}
          onSubmit={() => search()}
          invalid={Boolean(error)}
          disabled={loading}
        />
      </div>

      <div role="alert" className="min-h-6">
        {error && (
          <p className="mt-3 flex items-start gap-2 text-sm text-red-400">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}
      </div>

      <button className="btn-primary mt-3 w-full sm:w-auto" onClick={() => search()} disabled={loading || state.plate.length < 9}>
        {loading ? <><Loader2 size={18} className="animate-spin" /> Recherche du véhicule…</> : <><Search size={18} /> Identifier mon véhicule</>}
      </button>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-chrome-500">
        <span>Pas de plaque sous la main ? Essayez :</span>
        {EXAMPLES.map((p) => (
          <button key={p} type="button" className="chip hover:border-volt-500 hover:text-chrome-100"
            onClick={() => { dispatch({ type: 'SET_PLATE', plate: p }); search(p); }} disabled={loading}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
