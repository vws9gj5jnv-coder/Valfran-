/**
 * Logotype provisoire (typographique). Aucun logo officiel n'a été trouvé dans le projet :
 * remplacer ce composant par le logo définitif lorsqu'il sera disponible.
 */
export function Wordmark({ className = '', tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} aria-label="VALFRAN">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" className="shrink-0">
        <circle cx="13" cy="13" r="11.5" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1" />
        <path d="M7 8.5 13 19l6-10.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <line x1="2" y1="13" x2="24" y2="13" stroke="#B19776" strokeWidth="1" />
      </svg>
      <span
        aria-hidden="true"
        className={`text-[1.0625rem] font-medium tracking-[0.32em] ${tone === 'light' ? 'text-paper' : 'text-graphite'}`}
        style={{ fontStretch: '125%' }}
      >
        VALFRAN
      </span>
    </span>
  );
}
