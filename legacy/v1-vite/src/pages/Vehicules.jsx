import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, SearchX } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { VEHICLES } from '../data/vehicles';
import VehicleCard from '../components/VehicleCard';
import { CtaBand } from '../components/Sections';

const uniq = (k) => [...new Set(VEHICLES.map((v) => v[k]))].sort();
const MAX_PRICE = Math.ceil(Math.max(...VEHICLES.map((v) => v.price)) / 1000) * 1000;
const INITIAL = { brand: '', fuel: '', gearbox: '', price: MAX_PRICE, km: 200000, sort: 'price-asc' };

const Select = ({ label, value, onChange, options }) => (
  <div>
    <label className="label">{label}</label>
    <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Tous</option>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  </div>
);

export default function Vehicules() {
  useMeta('Véhicules d\'occasion révisés et garantis — Valfran Mécanique', 'Showroom de véhicules d\'occasion révisés, garantis, avec historique d\'entretien. Filtrez par budget, marque, carburant, boîte et kilométrage.');
  const [f, setF] = useState(INITIAL);
  const [open, setOpen] = useState(false);
  const set = (patch) => setF((p) => ({ ...p, ...patch }));

  const list = useMemo(() => {
    const r = VEHICLES.filter((v) =>
      (!f.brand || v.brand === f.brand) && (!f.fuel || v.fuel === f.fuel) && (!f.gearbox || v.gearbox === f.gearbox) &&
      v.price <= f.price && v.km <= f.km);
    const sorters = { 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, 'km-asc': (a, b) => a.km - b.km, 'year-desc': (a, b) => b.year - a.year };
    return r.sort(sorters[f.sort]);
  }, [f]);

  return (
    <section className="pb-20 pt-28 sm:pt-36">
      <div className="container-x">
        <div className="mb-10 max-w-2xl">
          <span className="eyebrow">Showroom</span>
          <h1 className="h-section mt-3">Véhicules d'occasion révisés &amp; garantis</h1>
          <p className="lead mt-4">Sélection rigoureuse, contrôle complet, historique d'entretien transparent.</p>
        </div>

        <div className="card mb-8 p-4 sm:p-5">
          <button className="btn-ghost w-full sm:hidden" onClick={() => setOpen(!open)} aria-expanded={open}><SlidersHorizontal size={16} /> Filtres</button>
          <div className={`${open ? 'mt-4 grid' : 'hidden'} gap-4 sm:mt-0 sm:grid sm:grid-cols-2 lg:grid-cols-6`}>
            <Select label="Marque" value={f.brand} onChange={(brand) => set({ brand })} options={uniq('brand')} />
            <Select label="Carburant" value={f.fuel} onChange={(fuel) => set({ fuel })} options={uniq('fuel')} />
            <Select label="Boîte" value={f.gearbox} onChange={(gearbox) => set({ gearbox })} options={uniq('gearbox')} />
            <div>
              <label className="label" htmlFor="pr">Budget max : {f.price.toLocaleString('fr-FR')} €</label>
              <input id="pr" type="range" min={5000} max={MAX_PRICE} step={500} value={f.price} onChange={(e) => set({ price: +e.target.value })} className="w-full accent-orange-500" />
            </div>
            <div>
              <label className="label" htmlFor="km">Km max : {f.km.toLocaleString('fr-FR')}</label>
              <input id="km" type="range" min={10000} max={200000} step={5000} value={f.km} onChange={(e) => set({ km: +e.target.value })} className="w-full accent-orange-500" />
            </div>
            <div>
              <label className="label">Trier par</label>
              <select className="field" value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
                <option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option>
                <option value="km-asc">Kilométrage</option><option value="year-desc">Plus récents</option>
              </select>
            </div>
          </div>
        </div>

        <p className="mb-4 text-sm text-chrome-400" aria-live="polite">{list.length} véhicule{list.length > 1 ? 's' : ''}</p>
        <motion.div layout className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((v) => (
              <motion.div key={v.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }}>
                <VehicleCard v={v} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {list.length === 0 && (
          <div className="card py-16 text-center">
            <SearchX className="mx-auto text-chrome-500" size={36} />
            <p className="mt-3 text-chrome-300">Aucun véhicule ne correspond à ces critères.</p>
            <button className="btn-ghost mt-4" onClick={() => setF(INITIAL)}>Réinitialiser les filtres</button>
          </div>
        )}
      </div>
      <div className="mt-20"><CtaBand title="Vous ne trouvez pas votre bonheur ?" text="Dites-moi ce que vous cherchez, je m'occupe de le trouver et de le réviser." to="/contact" label="Me contacter" /></div>
    </section>
  );
}
