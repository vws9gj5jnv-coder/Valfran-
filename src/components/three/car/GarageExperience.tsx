'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Box, Info, RotateCcw, X } from 'lucide-react';
import { detect3DQuality, whenIdle, type Quality } from '../capability';
import type { ZoneId } from './buildCar';

const GarageCanvas = dynamic(() => import('./GarageScene'), { ssr: false });

export interface ZoneInfo { id: ZoneId; label: string; title: string; text: string; services: { slug: string; name: string }[] }

export function GarageExperience({ zones, vehicleText, categoryNote, poster }: { zones: ZoneInfo[]; vehicleText: string | null; categoryNote: string | null; poster: string }) {
  const [quality, setQuality] = useState<Quality>('none');
  const [checked, setChecked] = useState(false);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<ZoneId | null>(null);
  const [posterMode, setPosterMode] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('poster') === '1') setPosterMode(true);
    const z = p.get('zone') as ZoneId | null;
    if (z && zones.some((x) => x.id === z)) setSelected(z);
    whenIdle(() => {
      const q = detect3DQuality();
      setQuality(q);
      setChecked(true);
      if (q !== 'none') setStarted(true);
    });
  }, [zones]);

  const zone = zones.find((z) => z.id === selected) ?? null;
  const can3D = quality !== 'none' && !failed;
  const show3D = can3D && started;
  const bookingHref = zone ? `/rendez-vous?service=${zone.services.map((s) => s.slug).join(',')}` : '/rendez-vous';

  return (
    <div className="on-dark relative bg-graphite text-paper">
      <div className="relative">
        <div className="relative h-[min(72svh,760px)] min-h-[420px] w-full overflow-hidden bg-[#141518]" data-garage-canvas>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt="Véhicule de démonstration VALFRAN dans l’atelier virtuel" className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${show3D && ready ? 'opacity-0' : 'opacity-100'}`} />
          {show3D && (
            <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>
              <GarageCanvas selected={selected} onSelect={setSelected} onReady={() => setReady(true)} onError={() => setFailed(true)} quality={quality === 'high' ? 'high' : 'medium'} posterMode={posterMode} />
            </div>
          )}
          {!posterMode && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-4 sm:p-6">
                <p className="pointer-events-auto max-w-md rounded-sm border border-paper/10 bg-graphite/75 px-3 py-2 text-[0.875rem] text-paper/85">
                  <strong className="text-paper">Prototype 3D de démonstration.</strong> Illustration générique non contractuelle : ce véhicule original ne représente pas votre automobile.
                </p>
                <Link href="/rendez-vous" className="btn btn-light btn-sm pointer-events-auto"><ArrowLeft className="size-4" aria-hidden="true" /> Revenir à la réservation</Link>
              </div>
              {!show3D && checked && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  {can3D ? (
                    <button type="button" className="btn btn-accent" onClick={() => setStarted(true)}><Box className="size-5" aria-hidden="true" /> Entrer dans le garage 3D</button>
                  ) : (
                    <p className="max-w-sm rounded-sm bg-graphite/80 p-4 text-center text-paper/85">La vue 3D n’est pas activée sur cet appareil (économie d’énergie ou animations réduites). Choisissez une zone ci-dessous : toutes les informations restent accessibles.</p>
                  )}
                </div>
              )}
              {show3D && !ready && <p className="absolute inset-x-0 bottom-6 text-center text-paper/70" role="status">Chargement de l’atelier…</p>}
              {show3D && ready && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-6">
                  <p className="hidden rounded-sm bg-graphite/70 px-3 py-2 text-[0.8125rem] text-paper/70 sm:block">Faites glisser pour tourner · molette ou pincement pour zoomer · touchez un repère</p>
                  {selected && <button type="button" onClick={() => setSelected(null)} className="btn btn-outline-light btn-sm pointer-events-auto bg-graphite/70"><RotateCcw className="size-4" aria-hidden="true" /> Vue d’ensemble</button>}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!posterMode && (
        <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_1.15fr] lg:py-14">
          <div>
            {vehicleText && (
              <p className="mb-6 rounded-sm border border-paper/15 p-4 text-[0.9375rem]">
                <span className="block text-paper/60">Votre véhicule</span>
                <strong className="text-[1.0625rem]">{vehicleText}</strong>
                {categoryNote && <span className="mt-1 block text-paper/60">{categoryNote}</span>}
              </p>
            )}
            <h2 className="text-h3 font-medium">Choisissez une zone</h2>
            <ul className="mt-5 grid grid-cols-2 gap-2">
              {zones.map((z, i) => (
                <li key={z.id}>
                  <button type="button" onClick={() => setSelected(selected === z.id ? null : z.id)} aria-pressed={selected === z.id}
                    className={`flex min-h-[56px] w-full items-center gap-3 rounded-sm border px-3 text-left transition-colors ${selected === z.id ? 'border-champagne bg-champagne text-graphite' : 'border-paper/15 hover:border-paper/40'}`}>
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[0.8125rem] font-semibold ${selected === z.id ? 'bg-graphite text-paper' : 'bg-paper/10'}`}>{i + 1}</span>
                    <span className="font-semibold">{z.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div aria-live="polite">
            {zone ? (
              <article className="rounded-sm border border-paper/15 bg-anthracite p-6 lg:p-8">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-h2 font-light wide">{zone.title}</h2>
                  <button type="button" className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-paper/15" aria-label="Fermer" onClick={() => setSelected(null)}><X className="size-5" aria-hidden="true" /></button>
                </div>
                <p className="mt-4 text-lead text-paper/80">{zone.text}</p>
                {zone.services.length > 0 && (
                  <>
                    <p className="mt-6 text-[0.9375rem] text-paper/60">Interventions associées</p>
                    <ul className="mt-2 flex flex-wrap gap-2">{zone.services.map((s) => <li key={s.slug}><Link href={`/services/${s.slug}`} className="badge min-h-[36px] border border-paper/20 px-3 font-medium hover:border-paper/50">{s.name}</Link></li>)}</ul>
                  </>
                )}
                <Link href={bookingHref} className="btn btn-accent mt-8">Demander une intervention <ArrowRight className="size-5" aria-hidden="true" /></Link>
              </article>
            ) : (
              <div className="flex h-full items-start gap-4 rounded-sm border border-dashed border-paper/15 p-6 text-paper/70">
                <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <p>Sélectionnez une zone sur le véhicule ou dans la liste pour découvrir les interventions possibles, puis demandez un rendez-vous en un clic. Vous pouvez aussi <Link href="/rendez-vous" className="link-u text-paper">réserver directement</Link>.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
