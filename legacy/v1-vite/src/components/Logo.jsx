export function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#11141a" stroke="#2e3542" />
      <path d="M14 16h10l8 24 8-24h10L36 50h-8z" fill="url(#lg)" />
      <circle cx="32" cy="32" r="27" fill="none" stroke="#ff7a29" strokeWidth="3" strokeDasharray="60 110" strokeLinecap="round" />
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#8f97a6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Logo({ showTagline = true }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-lg font-bold tracking-tight text-chrome-100">
          VALFRAN <span className="text-chrome-400 font-medium">MÉCANIQUE</span>
        </span>
        {showTagline && (
          <span className="mt-1 hidden whitespace-nowrap text-[10px] uppercase tracking-[.14em] text-chrome-500 2xl:block">
            Mécanique à domicile &amp; Véhicules d'occasion
          </span>
        )}
      </span>
    </span>
  );
}
