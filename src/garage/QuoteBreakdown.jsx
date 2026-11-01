import { Car, Wrench, Package, Plus } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';
import { eur } from '../lib/pricing';

const Line = ({ icon: I, label, value, muted }) => (
  <div className="flex items-center justify-between gap-3 py-2 text-sm">
    <span className="flex items-center gap-2 text-chrome-300"><I size={15} className="text-chrome-500" />{label}</span>
    <span className={muted ? 'text-chrome-500' : 'font-medium text-chrome-100'}>{value}</span>
  </div>
);

export default function QuoteBreakdown({ quote }) {
  if (!quote) return null;
  return (
    <div className="rounded-2xl border border-volt-500/30 bg-gradient-to-b from-ink-700 to-ink-800 p-5 shadow-glow">
      <div className="text-xs uppercase tracking-widest text-chrome-400">Estimation {quote.isQuote ? '(base diagnostic)' : 'TTC'}</div>
      <div className="mt-1 font-display text-4xl font-bold text-chrome-100 sm:text-5xl">
        <AnimatedNumber value={quote.total} />
      </div>
      <div className="mt-1 text-xs text-chrome-400">
        Fourchette : {eur(quote.min)} – {eur(quote.max)}
        {quote.isQuote && ' · devis ferme sous 24 h'}
      </div>
      <div className="mt-4 divide-y divide-ink-600 border-t border-ink-600">
        <Line icon={Wrench} label={`Main d'œuvre (${quote.hours} h)`} value={eur(quote.labor)} />
        {quote.parts > 0 && <Line icon={Package} label="Pièces & fournitures" value={eur(quote.parts)} />}
        {quote.addonItems.map((a) => (
          <Line key={a.id} icon={Plus} label={a.label} value={a.price ? `+ ${eur(Math.round(a.price))}` : 'Inclus'} />
        ))}
        <Line icon={Car} label="Déplacement à domicile"
          value={quote.hasZone ? (quote.travel === 0 ? 'Offert' : eur(quote.travel)) : 'Choisir une zone'} muted={!quote.hasZone} />
      </div>
    </div>
  );
}
