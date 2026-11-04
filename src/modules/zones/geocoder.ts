import { env } from '@/lib/env';

export interface AddressSuggestion {
  label: string;
  street: string;
  postcode: string;
  city: string;
  lat: number;
  lon: number;
  precision: 'address' | 'commune';
}

export interface Geocoder {
  readonly name: string;
  search(query: string): Promise<AddressSuggestion[]>;
}

type CommuneLike = { name: string; postcode: string; lat: number; lon: number };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Géocodage local : reconnaît la commune (nom ou code postal) dans la liste des communes configurées.
 * Ne nécessite aucun service externe. Précision : centre de la commune.
 */
export function localGeocoder(communes: CommuneLike[]): Geocoder {
  return {
    name: 'local',
    async search(query) {
      const q = norm(query);
      if (q.length < 2) return [];
      const cp = query.match(/\b\d{5}\b/)?.[0] ?? (/^\d{2,5}$/.test(q) ? q : undefined);
      return communes
        .map((c) => {
          const n = norm(c.name);
          let score = 0;
          if (cp && c.postcode.startsWith(cp)) score += cp.length === 5 ? 3 : 1;
          if (n === q) score += 4;
          else if (n.startsWith(q)) score += 2;
          else if (q.length >= 3 && n.includes(q)) score += 1;
          return { c, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name))
        .slice(0, 6)
        .map(({ c }) => ({ label: `${c.postcode} ${c.name}`, street: '', postcode: c.postcode, city: c.name, lat: c.lat, lon: c.lon, precision: 'commune' as const }));
    },
  };
}

/**
 * Base Adresse Nationale (service public gratuit, sans clé) : https://adresse.data.gouv.fr
 * Recherche limitée aux départements desservis.
 */
export const banGeocoder: Geocoder = {
  name: 'ban',
  async search(query) {
    if (query.trim().length < 3) return [];
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=6&autocomplete=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000), cache: 'no-store' });
    if (!res.ok) throw new Error(`BAN ${res.status}`);
    const data = (await res.json()) as { features: { geometry: { coordinates: [number, number] }; properties: { label: string; name: string; postcode: string; city: string; type: string } }[] };
    return data.features.map((f) => ({
      label: f.properties.label,
      street: f.properties.type === 'municipality' ? '' : f.properties.name,
      postcode: f.properties.postcode,
      city: f.properties.city,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      precision: f.properties.type === 'municipality' ? 'commune' : 'address',
    }));
  },
};

export async function geocode(query: string, communes: CommuneLike[]): Promise<{ results: AddressSuggestion[]; provider: string }> {
  if (env.geocoder === 'ban') {
    try {
      return { results: await banGeocoder.search(query), provider: 'ban' };
    } catch (e) {
      console.warn('[geocoder] BAN indisponible, repli local', (e as Error).message);
    }
  }
  return { results: await localGeocoder(communes).search(query), provider: 'local' };
}
