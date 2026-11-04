import { normalizePlate } from './plate';
import { getPlateProvider } from './providers';
import type { PlateLookupResult } from './types';
import { rateLimit, fingerprint } from '@/modules/security/rate-limit';
import { env } from '@/lib/env';

/**
 * Point d'entrée serveur : validation, limitation de fréquence (par visiteur et globale), appel du fournisseur.
 * La plaque n'est jamais journalisée en clair.
 */
export async function lookupPlate(rawPlate: string, ip: string): Promise<PlateLookupResult> {
  const check = normalizePlate(rawPlate);
  if (!check.ok) return { status: 'invalid', reason: check.reason };
  const perVisitor = await rateLimit(`plate:ip:${fingerprint(ip)}`, env.plateLookupsPerHour, 3600);
  if (!perVisitor.ok) return { status: 'rate_limited', retryAfterSec: perVisitor.retryAfterSec };
  const global = await rateLimit('plate:global:day', Number(process.env.PLATE_LOOKUPS_PER_DAY ?? 300), 86400);
  if (!global.ok) return { status: 'quota', demo: getPlateProvider().demo };
  try {
    return await getPlateProvider().lookup(check.normalized);
  } catch (e) {
    console.error('[plate] erreur fournisseur', { plate: fingerprint(check.normalized), error: (e as Error).message });
    return { status: 'unavailable', demo: getPlateProvider().demo };
  }
}
