import { Star } from 'lucide-react';

export default function Stars({ value, size = 16 }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= value ? 'fill-ember-500 text-ember-500' : 'text-ink-500'} />
      ))}
    </span>
  );
}
