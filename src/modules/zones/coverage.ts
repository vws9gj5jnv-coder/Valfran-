import type { ZoneSettings } from '@/modules/settings/schema';

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Distance à vol d'oiseau (km). */
export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type CommuneRule = { status: string; travelFeeOverrideCents: number | null } | null;

export interface Coverage {
  status: 'served' | 'on_request' | 'outside';
  /** Distance routière estimée (vol d'oiseau × coefficient routier), arrondie. */
  distanceKm: number;
  feeCents: number | null;
  /** Durée de trajet estimée (min) à 50 km/h de moyenne. */
  travelMinutes: number;
}

/**
 * Règles de déplacement : rayon maximal, paliers de frais, exceptions par commune.
 * Les exceptions communales (exclue / sur demande / frais spécifiques) priment sur le rayon.
 */
export function computeCoverage(point: { lat: number; lon: number }, zone: ZoneSettings, rule: CommuneRule = null): Coverage {
  const crow = haversineKm({ lat: zone.baseLat, lon: zone.baseLon }, point);
  const distanceKm = Math.round(crow * zone.roadFactor);
  const travelMinutes = Math.max(5, Math.round((distanceKm / 50) * 60));
  if (rule?.status === 'excluded') return { status: 'outside', distanceKm, feeCents: null, travelMinutes };
  const tiers = [...zone.tiers].sort((a, b) => a.upToKm - b.upToKm);
  const tier = tiers.find((t) => distanceKm <= t.upToKm);
  let feeCents = rule?.travelFeeOverrideCents ?? tier?.feeCents ?? null;
  let status: Coverage['status'] = 'served';
  if (distanceKm > zone.maxKm || !tier) {
    status = zone.outsidePolicy === 'refuse' ? 'outside' : 'on_request';
    if (rule?.travelFeeOverrideCents == null) feeCents = null;
  }
  if (rule?.status === 'on_request') status = 'on_request';
  if (rule?.status === 'served' && status !== 'served' && rule.travelFeeOverrideCents != null) status = 'served';
  return { status, distanceKm, feeCents, travelMinutes };
}
