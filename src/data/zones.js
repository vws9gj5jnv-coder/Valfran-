import { BUSINESS } from './business';

const R = 6371;
const rad = (d) => (d * Math.PI) / 180;
export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const RAW = [
  { id: 'vesoul', name: 'Vesoul', dept: '70', lat: 47.6197, lon: 6.1553 },
  { id: 'lure', name: 'Lure', dept: '70', lat: 47.6844, lon: 6.4954 },
  { id: 'luxeuil', name: 'Luxeuil-les-Bains', dept: '70', lat: 47.8225, lon: 6.3792 },
  { id: 'gray', name: 'Gray', dept: '70', lat: 47.4469, lon: 5.5917 },
  { id: 'port-sur-saone', name: 'Port-sur-Saône', dept: '70', lat: 47.6906, lon: 6.0392 },
  { id: 'villersexel', name: 'Villersexel', dept: '70', lat: 47.5517, lon: 6.4328 },
  { id: 'hericourt', name: 'Héricourt', dept: '70', lat: 47.5733, lon: 6.7667 },
  { id: 'jussey', name: 'Jussey', dept: '70', lat: 47.8231, lon: 5.9022 },
  { id: 'epinal', name: 'Épinal', dept: '88', lat: 48.1733, lon: 6.4497 },
  { id: 'remiremont', name: 'Remiremont', dept: '88', lat: 48.0189, lon: 6.5897 },
  { id: 'saint-die', name: 'Saint-Dié-des-Vosges', dept: '88', lat: 48.2847, lon: 6.9494 },
  { id: 'vittel', name: 'Vittel', dept: '88', lat: 48.2025, lon: 5.9456 },
  { id: 'mirecourt', name: 'Mirecourt', dept: '88', lat: 48.3, lon: 6.1333 },
  { id: 'darney', name: 'Darney', dept: '88', lat: 48.0942, lon: 5.9983 },
];

export const MAX_KM = 75;

export const TRAVEL_TIERS = [
  { max: 15, fee: 15, label: '0 – 15 km' },
  { max: 30, fee: 25, label: '15 – 30 km' },
  { max: 50, fee: 40, label: '30 – 50 km' },
  { max: MAX_KM, fee: 60, label: '50 – 75 km' },
];

export function travelFee(km) {
  const t = TRAVEL_TIERS.find((x) => km <= x.max);
  return t ? t.fee : null;
}

export const CITIES = RAW.map((c) => {
  const km = Math.round(distanceKm(BUSINESS.base, c));
  return { ...c, km, fee: travelFee(km) };
}).sort((a, b) => a.km - b.km);

export const getCity = (id) => CITIES.find((c) => c.id === id);
