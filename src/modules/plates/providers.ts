import type { PlateProvider, PlateLookupResult, IdentifiedVehicle } from './types';
import { categorize } from '@/modules/vehicles/catalog';
import { env } from '@/lib/env';

/** Plaques fictives reconnues en mode démonstration (aucune donnée réelle). */
export const DEMO_PLATES: Record<string, IdentifiedVehicle[] | 'not_found' | 'unavailable' | 'quota'> = {
  'AB-123-CD': [{ make: 'Renault', model: 'Clio', version: 'IV', year: 2017, fuel: 'Diesel', engine: '1.5 dCi 90', category: 'citadine' }],
  'EF-456-GH': [
    { make: 'Peugeot', model: '308', version: 'II', year: 2019, fuel: 'Essence', engine: '1.2 PureTech 130', category: 'compacte' },
    { make: 'Peugeot', model: '308', version: 'II', year: 2019, fuel: 'Diesel', engine: '1.5 BlueHDi 130', category: 'compacte' },
  ],
  'JK-789-LM': [{ make: 'Dacia', model: 'Duster', version: 'II', year: 2021, fuel: 'Essence', engine: '1.3 TCe 130', category: 'suv' }],
  'NP-321-QR': [{ make: 'Renault', model: 'Kangoo', version: 'II', year: 2016, fuel: 'Diesel', engine: '1.5 dCi 90', category: 'utilitaire' }],
  'ZZ-999-ZZ': 'not_found',
  'XX-500-XX': 'unavailable',
  'XX-429-XX': 'quota',
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const demoProvider: PlateProvider = {
  name: 'demo',
  demo: true,
  async lookup(plate) {
    await delay(450);
    const entry = DEMO_PLATES[plate];
    if (!entry || entry === 'not_found') return { status: 'not_found', demo: true };
    if (entry === 'unavailable') return { status: 'unavailable', demo: true };
    if (entry === 'quota') return { status: 'quota', demo: true };
    return { status: 'found', vehicles: entry, provider: 'demo', demo: true };
  },
};

/**
 * Adaptateur HTTP générique pour un fournisseur autorisé d'identification par plaque.
 * ⚠️ Gabarit à adapter au contrat du fournisseur retenu (format de réponse, authentification).
 * Non testé avec un fournisseur réel. Vérifier les conditions contractuelles et légales avant usage.
 * PLATE_API_URL doit contenir {plate}, ex. https://api.fournisseur.example/v1/vehicles?plate={plate}
 */
export const httpProvider: PlateProvider = {
  name: 'http',
  demo: false,
  async lookup(plate, signal) {
    if (!env.plateApiUrl || !env.plateApiKey) return { status: 'disabled' };
    let res: Response;
    try {
      res = await fetch(env.plateApiUrl.replace('{plate}', encodeURIComponent(plate)), {
        headers: { Authorization: `Bearer ${env.plateApiKey}`, Accept: 'application/json' },
        signal: signal ?? AbortSignal.timeout(8000),
        cache: 'no-store',
      });
    } catch {
      return { status: 'unavailable', demo: false };
    }
    if (res.status === 404) return { status: 'not_found', demo: false };
    if (res.status === 429 || res.status === 402) return { status: 'quota', demo: false };
    if (!res.ok) return { status: 'unavailable', demo: false };
    const data = (await res.json().catch(() => null)) as unknown;
    const list = Array.isArray(data) ? data : data && typeof data === 'object' && 'vehicles' in data ? (data as { vehicles: unknown[] }).vehicles : [data];
    const vehicles = list.map(mapVehicle).filter((v): v is IdentifiedVehicle => v !== null);
    if (vehicles.length === 0) return { status: 'not_found', demo: false };
    return { status: 'found', vehicles, provider: 'http', demo: false };
  },
};

function pick(o: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) if (typeof o[k] === 'string' && o[k]) return String(o[k]);
  for (const k of keys) if (typeof o[k] === 'number') return String(o[k]);
  return undefined;
}

/** Ne conserve que les champs réellement fournis par l'API. */
function mapVehicle(raw: unknown): IdentifiedVehicle | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const make = pick(o, 'make', 'marque', 'brand');
  const model = pick(o, 'model', 'modele', 'modèle');
  if (!make || !model) return null;
  const yearStr = pick(o, 'year', 'annee', 'date_mise_en_circulation', 'first_registration');
  const year = yearStr ? Number(String(yearStr).match(/\d{4}/)?.[0]) || undefined : undefined;
  return {
    make, model,
    version: pick(o, 'version', 'generation'),
    year,
    fuel: pick(o, 'fuel', 'energie', 'carburant'),
    engine: pick(o, 'engine', 'motorisation', 'moteur'),
    category: categorize(make, model),
  };
}

export const disabledProvider: PlateProvider = { name: 'none', demo: false, async lookup(): Promise<PlateLookupResult> { return { status: 'disabled' }; } };

export function getPlateProvider(): PlateProvider {
  switch (env.plateProvider) {
    case 'http': return httpProvider;
    case 'none': return disabledProvider;
    default: return demoProvider;
  }
}
