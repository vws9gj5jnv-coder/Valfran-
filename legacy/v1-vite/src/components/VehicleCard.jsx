import { Link } from 'react-router-dom';
import { Fuel, Gauge, Calendar, Cog } from 'lucide-react';
import CarVisual from './CarVisual';

export default function VehicleCard({ v }) {
  return (
    <Link to={`/vehicules/${v.id}`} className="card card-hover group block overflow-hidden">
      <div className="relative bg-gradient-to-b from-ink-600 to-ink-800 px-6 pb-2 pt-8">
        <span className="absolute left-4 top-4 chip !border-emerald-500/40 !text-emerald-300">Révisé · Garanti</span>
        <CarVisual color={v.color} body={v.body} className="w-full transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{v.brand} {v.model}</h3>
            <p className="text-sm text-chrome-400">{v.version}</p>
          </div>
          <div className="text-right font-display text-xl font-bold text-ember-400">{v.price.toLocaleString('fr-FR')} €</div>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-y-2 text-xs text-chrome-300">
          <li className="flex items-center gap-1.5"><Calendar size={14} className="text-volt-400" />{v.year}</li>
          <li className="flex items-center gap-1.5"><Gauge size={14} className="text-volt-400" />{v.km.toLocaleString('fr-FR')} km</li>
          <li className="flex items-center gap-1.5"><Fuel size={14} className="text-volt-400" />{v.fuel}</li>
          <li className="flex items-center gap-1.5"><Cog size={14} className="text-volt-400" />{v.gearbox}</li>
        </ul>
      </div>
    </Link>
  );
}
