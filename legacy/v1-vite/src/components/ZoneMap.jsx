import { useState } from 'react';
import { BUSINESS } from '../data/business';
import { CITIES, TRAVEL_TIERS } from '../data/zones';
import { eur } from '../lib/pricing';

// Projection équirectangulaire locale centrée sur la base (1° lat ≈ 111 km, 1° lon ≈ 111·cos(lat) km)
const KX = 111 * Math.cos((BUSINESS.base.lat * Math.PI) / 180);
const KY = 111;
const SCALE = 3.1; // px par km
const W = 640, H = 560;
const cx = W / 2, cy = H / 2 + 10;
const r1 = (n) => Math.round(n * 10) / 10; // arrondi : évite les écarts flottants Node/navigateur à l'hydratation
const proj = (p) => ({
  x: r1(cx + (p.lon - BUSINESS.base.lon) * KX * SCALE),
  y: r1(cy - (p.lat - BUSINESS.base.lat) * KY * SCALE),
});

/** Carte schématique interactive de la zone d'intervention (rayon 75 km autour de Vesoul). */
export default function ZoneMap() {
  const [active, setActive] = useState('vesoul');
  const city = CITIES.find((c) => c.id === active);
  const rings = [...TRAVEL_TIERS].reverse();
  const colors = ['rgba(79,140,255,.05)', 'rgba(79,140,255,.07)', 'rgba(79,140,255,.10)', 'rgba(79,140,255,.14)'];

  return (
    <div className="card overflow-hidden">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Carte de la zone d'intervention autour de Vesoul, rayon de 75 kilomètres">
          <defs>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#2e3542" /></pattern>
          </defs>
          <rect width={W} height={H} fill="url(#dots)" />
          {rings.map((t, i) => (
            <g key={t.max}>
              <circle cx={cx} cy={cy} r={t.max * SCALE} fill={colors[i]} stroke="#4f8cff" strokeOpacity=".35" strokeDasharray="4 6" />
              <text x={cx + t.max * SCALE * 0.72} y={cy - t.max * SCALE * 0.72 - 4} fill="#8f97a6" fontSize="11" textAnchor="middle">{t.max} km</text>
            </g>
          ))}
          <line x1="0" y1={cy} x2={W} y2={cy} stroke="#222833" /><line x1={cx} y1="0" x2={cx} y2={H} stroke="#222833" />
          {CITIES.map((c) => {
            const p = proj(c);
            const on = c.id === active;
            const base = c.id === 'vesoul';
            return (
              <g key={c.id} transform={`translate(${p.x} ${p.y})`} className="cursor-pointer" onClick={() => setActive(c.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActive(c.id)} tabIndex={0} role="button" aria-label={`${c.name}, ${c.km} km`}>
                {base && <circle r="16" fill="#ff7a29" opacity=".18"><animate attributeName="r" values="10;22;10" dur="2.6s" repeatCount="indefinite" /></circle>}
                <circle r={on ? 9 : base ? 7 : 5.5} fill={base || on ? '#ff7a29' : '#d9dde4'} stroke="#07080a" strokeWidth="2" style={{ transition: 'all .2s' }} />
                <text y={-13} textAnchor="middle" fontSize={on ? 13 : 11} fontWeight={on ? 700 : 500} fill={on ? '#fff' : '#b7bdc8'} stroke="#07080a" strokeWidth="3" paintOrder="stroke">{c.name.replace('-des-Vosges', '').replace('-les-Bains', '')}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-600 bg-ink-900/70 px-5 py-4">
        <div>
          <div className="font-display text-lg font-semibold text-chrome-100">{city.name} <span className="text-sm font-normal text-chrome-500">({city.dept})</span></div>
          <div className="text-sm text-chrome-400">≈ {city.km} km de {BUSINESS.base.city}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-chrome-500">Forfait déplacement</div>
          <div className="font-display text-2xl font-bold text-ember-400">{eur(city.fee)}</div>
        </div>
      </div>
    </div>
  );
}
