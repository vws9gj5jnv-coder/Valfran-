import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';
import { eur } from '../lib/pricing';

/** Compteur animé pour le simulateur de prix. */
export default function AnimatedNumber({ value, className = '' }) {
  const ref = useRef(null);
  const prev = useRef(value);
  useEffect(() => {
    const ctl = animate(prev.current, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (v) => { if (ref.current) ref.current.textContent = eur(Math.round(v)); },
    });
    prev.current = value;
    return () => ctl.stop();
  }, [value]);
  return <span ref={ref} className={className}>{eur(value)}</span>;
}
