import { useId } from 'react';

/** Silhouette de véhicule générée en SVG (placeholder léger, remplaçable par de vraies photos). */
export default function CarVisual({ color = '#8f97a6', body = 'Compacte', className = '', angle = 0 }) {
  const id = useId();
  const suv = body === 'SUV';
  const sedan = body === 'Berline';
  const small = body === 'Citadine';
  const roof = suv ? 62 : sedan ? 74 : small ? 70 : 68;
  const path = sedan
    ? `M30 128 L40 112 Q46 104 66 100 L110 74 Q120 ${roof} 140 ${roof} L214 ${roof} Q238 ${roof + 2} 252 90 L292 102 Q330 106 338 124 L346 128 Z`
    : `M30 128 L38 108 Q44 100 66 98 L100 ${roof + 6} Q112 ${roof} 130 ${roof} L${small ? 232 : 250} ${roof} Q${small ? 252 : 270} ${roof + 4} ${small ? 262 : 280} 96 L318 102 Q340 108 344 124 L348 128 Z`;
  return (
    <svg viewBox="0 0 380 170" className={className} role="img" aria-label="Illustration du véhicule" style={{ transform: angle ? `scaleX(${angle})` : undefined }}>
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} /><stop offset="1" stopColor={color} stopOpacity=".55" />
        </linearGradient>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c7d6ee" stopOpacity=".55" /><stop offset="1" stopColor="#0b0d10" stopOpacity=".85" />
        </linearGradient>
        <radialGradient id={`s${id}`}><stop offset="0" stopColor="#000" stopOpacity=".6" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="190" cy="146" rx="165" ry="9" fill={`url(#s${id})`} />
      <path d={path} fill={`url(#b${id})`} stroke="rgba(255,255,255,.25)" strokeWidth="1.2" />
      <path d={`M112 ${roof + 8} L${sedan ? 128 : 124} ${roof + 3} L${sedan ? 238 : 226} ${roof + 3} Q${sedan ? 246 : 240} ${roof + 6} 252 94 L100 98 Z`} fill={`url(#g${id})`} />
      <line x1="178" y1={roof + 5} x2="178" y2="96" stroke="rgba(0,0,0,.45)" strokeWidth="2" />
      <path d="M340 112 L346 112" stroke="#ffd9a8" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 112 L38 112" stroke="#ff4d3a" strokeWidth="4" strokeLinecap="round" />
      {[96, 282].map((x) => (
        <g key={x}>
          <circle cx={x} cy="128" r="22" fill="#0b0d10" stroke="#2e3542" strokeWidth="2" />
          <circle cx={x} cy="128" r="12" fill="#b7bdc8" />
          <circle cx={x} cy="128" r="4" fill="#222833" />
        </g>
      ))}
    </svg>
  );
}
