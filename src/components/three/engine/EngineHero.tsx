'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { detect3DQuality, whenIdle, type Quality } from '../capability';
import type { EngineLabel } from './EngineScene';

const EngineCanvas = dynamic(() => import('./EngineCanvas'), { ssr: false });

const LABELS: { part: EngineLabel['part']; at: [number, number, number]; n: string; text: string }[] = [
  { part: 'crank', at: [-1.8, -0.45, 0.2], n: '01', text: 'Vilebrequin' },
  { part: 'pistons', at: [1.35, 2.2, 0.4], n: '02', text: 'Pistons et bielles' },
  { part: 'head', at: [1.9, 2.95, 0.7], n: '03', text: 'Culasse 16 soupapes' },
  { part: 'cams', at: [1.6, 3.15, 0.5], n: '04', text: 'Arbres à cames' },
  { part: 'timing', at: [-2.35, 1.5, 0.6], n: '05', text: 'Distribution 2 : 1' },
];

/**
 * Visuel du hero : une image statique s'affiche immédiatement (et reste seule sur les appareils
 * modestes ou si « réduire les animations » est actif). La scène 3D est chargée ensuite, pendant un
 * temps mort du navigateur, et apparaît en fondu par-dessus l'image, sans jamais bloquer les boutons.
 */
export function EngineHero({ poster }: { poster: string }) {
  const [quality, setQuality] = useState<Quality>('none');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [freezeAt, setFreezeAt] = useState<number | undefined>(undefined);
  const wrap = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<EngineLabel[]>(LABELS.map((l) => ({ el: null, part: l.part, at: l.at })));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get('engine-t');
    if (f !== null && !Number.isNaN(Number(f))) setFreezeAt(Number(f));
    whenIdle(() => setQuality(detect3DQuality()));
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const onVis = () => setVisible(document.visibilityState === 'visible' && el.getBoundingClientRect().bottom > 0);
    document.addEventListener('visibilitychange', onVis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const show3D = quality !== 'none' && !failed;

  return (
    <div ref={wrap} className="relative mx-auto aspect-square w-full max-w-[min(100%,calc(100svh-150px))] min-w-[min(100%,420px)] select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        width={1200}
        height={1200}
        fetchPriority="high"
        decoding="async"
        className={`absolute inset-0 size-full object-contain transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
      />
      {show3D && (
        <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <EngineCanvas
            running={!paused && visible}
            freezeAt={freezeAt}
            labels={labelsRef.current}
            quality={quality === 'high' ? 'high' : 'medium'}
            onReady={() => setReady(true)}
            onError={() => setFailed(true)}
          />
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {LABELS.map((l, i) => (
              <div
                key={l.n}
                ref={(el) => { labelsRef.current[i].el = el; }}
                className="absolute left-0 top-0 hidden items-center gap-2 whitespace-nowrap text-[0.75rem] uppercase tracking-[0.16em] text-paper/80 md:flex"
                style={{ opacity: 0, fontStretch: '110%' }}
              >
                <span className="h-px w-6 bg-champagne" />
                <span className="tabular-nums text-champagne-2">{l.n}</span>
                <span>{l.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {show3D && ready && freezeAt === undefined && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="absolute bottom-2 right-2 inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-paper/15 bg-graphite/60 px-3 text-[0.8125rem] text-paper/80 hover:text-paper"
          aria-label={paused ? 'Reprendre l’animation du moteur' : 'Mettre en pause l’animation du moteur'}
        >
          {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
          {paused ? 'Lecture' : 'Pause'}
        </button>
      )}
    </div>
  );
}
