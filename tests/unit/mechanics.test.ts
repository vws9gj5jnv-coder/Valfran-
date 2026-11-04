import { describe, it, expect } from 'vitest';
import { DIM, sliderCrank, camRadius } from '@/components/three/engine/geometry';

describe('cinématique du moteur 3D', () => {
  it('point mort haut et point mort bas cohérents avec la course', () => {
    const tdc = sliderCrank(0).pistonY;
    const bdc = sliderCrank(Math.PI).pistonY;
    expect(tdc).toBeCloseTo(DIM.crankR + DIM.rodL, 6);
    expect(tdc - bdc).toBeCloseTo(DIM.stroke, 6);
  });
  it('le piston ne dépasse jamais le plan de joint', () => {
    for (let a = 0; a < Math.PI * 2; a += 0.05) expect(sliderCrank(a).pistonY + DIM.pistonCompression).toBeLessThanOrEqual(DIM.deckY);
  });
  it('profil de came : cercle de base hors levée, levée maximale au sommet', () => {
    expect(camRadius(Math.PI)).toBeCloseTo(DIM.camBase);
    expect(camRadius(0)).toBeCloseTo(DIM.camBase + DIM.camLift);
  });
  it('vilebrequin plat : manetons 1-4 et 2-3 opposés, ordre 1-3-4-2', () => {
    expect(DIM.pinPhase).toEqual([0, Math.PI, Math.PI, 0]);
    const order = DIM.cycleOffsetDeg.map((d, i) => ({ d, cyl: i + 1 })).sort((a, b) => a.d - b.d).map((x) => x.cyl);
    expect(order).toEqual([1, 3, 4, 2]);
  });
});
