'use client';

import { useEffect, useRef } from 'react';

/**
 * Apparition progressive au défilement. Le contenu est visible sans JavaScript ; seuls les éléments
 * situés sous la ligne de flottaison sont animés, et jamais si « réduire les animations » est actif.
 */
export function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.classList.add('reveal-pending');
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect(); }
    }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>{children}</div>;
}
