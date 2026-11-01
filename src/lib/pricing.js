import { BUSINESS } from '../data/business';
import { getService } from '../data/services';
import { getCity } from '../data/zones';

const LABOR = { Citadine: 1, Compacte: 1.05, Berline: 1.15, SUV: 1.25, Utilitaire: 1.2 };
const PARTS = { Citadine: 0.85, Compacte: 1, Berline: 1.2, SUV: 1.4, Utilitaire: 1.3 };
const FUEL_PARTS = { Diesel: 1.05, Hybride: 1.15, Électrique: 1.25 };

const round5 = (n) => Math.round(n / 5) * 5;

export function isApplicable(service, vehicle) {
  if (!service.notFor || !vehicle) return true;
  return !service.notFor.fuel.includes(vehicle.fuel);
}

/**
 * Calcule un devis estimatif.
 * @returns null si les données sont insuffisantes, sinon le détail + fourchette.
 */
export function computeQuote({ vehicle, serviceId, addons = [], cityId }) {
  const service = getService(serviceId);
  if (!service || !vehicle) return null;
  const city = getCity(cityId);

  const cat = vehicle.category;
  const labor = round5(service.hours * BUSINESS.hourlyRate * (LABOR[cat] ?? 1));
  const base = service.parts * (PARTS[cat] ?? 1) * (FUEL_PARTS[vehicle.fuel] ?? 1);
  const parts = round5(base);
  const addonItems = service.addons.filter((a) => addons.includes(a.id));
  const addonsTotal = addonItems.reduce((s, a) => s + Math.round(a.price * (PARTS[cat] ?? 1)), 0);
  const travel = city ? city.fee : null;

  const subtotal = labor + parts + addonsTotal;
  const total = subtotal + (travel ?? 0);
  const spread = service.quote ? 0.35 : 0.1;

  return {
    service, city, labor, parts, addonItems, addonsTotal, travel, subtotal, total,
    min: round5(total * (1 - spread)),
    max: round5(total * (1 + spread)),
    isQuote: Boolean(service.quote),
    hasZone: Boolean(city),
    hours: service.hours,
  };
}

export const eur = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
