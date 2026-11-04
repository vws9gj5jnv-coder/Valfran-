import { createContext, useContext, useMemo, useReducer } from 'react';
import { computeQuote } from '../lib/pricing';

export const STEPS = [
  { id: 1, key: 'plate', label: 'Plaque' },
  { id: 2, key: 'vehicle', label: 'Véhicule' },
  { id: 3, key: 'service', label: 'Intervention' },
  { id: 4, key: 'quote', label: 'Estimation' },
  { id: 5, key: 'booking', label: 'Rendez-vous' },
];

export const initialState = {
  step: 1,
  plate: '',
  vehicle: null,
  serviceId: null,
  addons: [],
  otherNote: '',
  cityId: '',
  date: null,
  slot: null,
  placeType: 'domicile', // 'domicile' | 'travail'
  address: '',
  contact: { name: '', phone: '', email: '', notes: '', consent: false },
  confirmation: null,
};

function reducer(state, a) {
  switch (a.type) {
    case 'SET_PLATE': return { ...state, plate: a.plate };
    case 'SET_VEHICLE': return { ...state, vehicle: a.vehicle, step: 2 };
    case 'SELECT_SERVICE': return { ...state, serviceId: a.id, addons: [] };
    case 'TOGGLE_ADDON':
      return { ...state, addons: state.addons.includes(a.id) ? state.addons.filter((x) => x !== a.id) : [...state.addons, a.id] };
    case 'SET': return { ...state, ...a.patch };
    case 'SET_CONTACT': return { ...state, contact: { ...state.contact, ...a.patch } };
    case 'GO': return { ...state, step: a.step };
    case 'CONFIRM': return { ...state, confirmation: a.confirmation };
    case 'RESET': return { ...initialState };
    default: return state;
  }
}

const Ctx = createContext(null);

export function GarageProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const quote = useMemo(
    () => computeQuote({ vehicle: state.vehicle, serviceId: state.serviceId, addons: state.addons, cityId: state.cityId }),
    [state.vehicle, state.serviceId, state.addons, state.cityId],
  );
  const value = useMemo(() => ({ state, dispatch, quote }), [state, quote]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useGarage = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGarage doit être utilisé dans <GarageProvider>');
  return v;
};
