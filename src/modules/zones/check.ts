import { getSetting, findCommune, listCommunes } from '@/modules/settings/repo';
import { computeCoverage, type Coverage } from './coverage';
import { banGeocoder } from './geocoder';
import { env } from '@/lib/env';

export interface AddressCheck {
  status: Coverage['status'] | 'unknown';
  distanceKm: number | null;
  feeCents: number | null;
  travelMinutes: number | null;
  lat: number | null;
  lon: number | null;
  message: string;
}

/**
 * Vérifie la zone desservie pour une adresse. Les coordonnées sont toujours déterminées côté serveur
 * (jamais reprises du navigateur). Priorité : commune connue (avec ses exceptions) > géocodage BAN.
 */
export async function checkAddress(a: { street: string; postcode: string; city: string }): Promise<AddressCheck> {
  const zone = await getSetting('zone');
  const commune = await findCommune(a.postcode, a.city);
  let point: { lat: number; lon: number } | null = commune ? { lat: commune.lat, lon: commune.lon } : null;
  if (env.geocoder === 'ban') {
    try {
      const r = await banGeocoder.search(`${a.street} ${a.postcode} ${a.city}`);
      const best = r.find((x) => x.postcode === a.postcode) ?? null;
      if (best) point = { lat: best.lat, lon: best.lon };
    } catch { /* repli sur la commune */ }
  }
  if (!point) {
    const sameCp = (await listCommunes()).find((c) => c.postcode === a.postcode);
    if (sameCp) point = { lat: sameCp.lat, lon: sameCp.lon };
  }
  if (!point) {
    return {
      status: zone.outsidePolicy === 'refuse' ? 'unknown' : 'on_request', distanceKm: null, feeCents: null, travelMinutes: null, lat: null, lon: null,
      message: 'Nous ne pouvons pas situer automatiquement cette commune. Vous pouvez envoyer votre demande : nous vérifierons le déplacement avec vous.',
    };
  }
  const cov = computeCoverage(point, zone, commune ? { status: commune.status, travelFeeOverrideCents: commune.travelFeeOverrideCents } : null);
  const message =
    cov.status === 'served'
      ? cov.feeCents === 0 ? 'Votre adresse est dans notre secteur. Déplacement offert.' : 'Votre adresse est dans notre secteur.'
      : cov.status === 'on_request'
        ? 'Votre adresse est en limite de secteur. Envoyez votre demande : nous vous confirmerons le déplacement et son coût.'
        : 'Désolé, cette adresse est hors de notre zone d’intervention.';
  return { ...cov, lat: point.lat, lon: point.lon, message };
}
