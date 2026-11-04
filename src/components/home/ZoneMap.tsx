import type { Commune } from '@/modules/settings/repo';

/**
 * Carte schématique (projection équirectangulaire locale) : base, communes desservies et rayon indicatif.
 * Sans tuile cartographique externe : légère, rapide, sans cookie ni clé d'API.
 */
export function ZoneMap({ communes, base, radiusKm }: { communes: Commune[]; base: { lat: number; lon: number; name: string }; radiusKm?: number }) {
  const W = 640, H = 560;
  const kmPerDegLat = 111.2;
  const kmPerDegLon = 111.2 * Math.cos((base.lat * Math.PI) / 180);
  const pts = communes.map((c) => ({ c, x: (c.lon - base.lon) * kmPerDegLon, y: (c.lat - base.lat) * kmPerDegLat }));
  const extent = Math.max(30, ...pts.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y)))) * 1.12;
  const s = Math.min(W, H) / 2 / extent;
  const cx = W / 2, cy = H / 2;
  const P = (x: number, y: number) => [Math.round(cx + x * s), Math.round(cy - y * s)] as const;
  const r = radiusKm ? radiusKm * s : null;
  return (
    <figure className="relative overflow-hidden rounded-sm border border-graphite/10 bg-graphite text-paper">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-labelledby="zonemap-title zonemap-desc">
        <title id="zonemap-title">Carte schématique des communes desservies</title>
        <desc id="zonemap-desc">{`Base : ${base.name}. ${communes.length} communes desservies dans les Vosges et en Haute-Saône.`}</desc>
        <defs>
          <pattern id="zm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(245,244,240,0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#zm-grid)" />
        {[10, 20, 30, 40].map((km) => (
          <circle key={km} cx={cx} cy={cy} r={Math.round(km * s)} fill="none" stroke="rgba(245,244,240,0.09)" strokeDasharray="2 5" />
        ))}
        {[10, 20, 30, 40].map((km) => (
          <text key={`t${km}`} x={cx + 4} y={Math.round(cy - km * s) - 4} fontSize="11" fill="rgba(245,244,240,0.4)">{km} km</text>
        ))}
        {r && <circle cx={cx} cy={cy} r={Math.round(r)} fill="rgba(177,151,118,0.06)" stroke="#B19776" strokeOpacity="0.5" />}
        {pts.map(({ c, x, y }) => {
          const [px, py] = P(x, y);
          const isFeat = c.featured;
          return (
            <g key={c.id}>
              <circle cx={px} cy={py} r={isFeat ? 4.5 : 2.5} fill={c.status === 'excluded' ? 'transparent' : isFeat ? '#F5F4F0' : 'rgba(245,244,240,0.55)'} stroke={c.status === 'excluded' ? 'rgba(245,244,240,0.5)' : 'none'} />
              {isFeat && <text x={px + 9} y={py + 4} fontSize="14" fill="rgba(245,244,240,0.9)">{c.name}</text>}
            </g>
          );
        })}
        <g>
          <circle cx={cx} cy={cy} r="9" fill="none" stroke="#B19776" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="3.5" fill="#B19776" />
        </g>
        <text x={W - 16} y={H - 16} textAnchor="end" fontSize="11" fill="rgba(245,244,240,0.45)">N ↑ · distances à vol d’oiseau</text>
      </svg>
    </figure>
  );
}
