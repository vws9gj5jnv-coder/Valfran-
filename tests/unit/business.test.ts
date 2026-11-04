import { describe, it, expect } from 'vitest';
import { normalizePlate } from '@/modules/plates/plate';
import { computeCoverage, haversineKm } from '@/modules/zones/coverage';
import { computeWindows, zonedToUtc, tzOffsetMinutes } from '@/modules/availability/windows';
import { buildEstimate, type PricedService } from '@/modules/pricing/estimate';
import { computeTotals, isQuoteExpired } from '@/modules/quotes/totals';
import { canTransition } from '@/modules/bookings/status';
import { bookingInputSchema } from '@/modules/bookings/input';
import { normalizeFrenchPhone, slugify, euros } from '@/lib/text';
import { bookingReference } from '@/lib/ids';
import { sniffImageType } from '@/modules/storage/storage';
import { buildIcs } from '@/modules/calendar/ics';
import { categorize } from '@/modules/vehicles/catalog';
import { defaultSettings } from '@/modules/settings/defaults';
import { settingsSchemas } from '@/modules/settings/schema';

describe('immatriculation', () => {
  it('normalise le format SIV', () => {
    expect(normalizePlate('ab123cd')).toEqual({ ok: true, normalized: 'AB-123-CD', format: 'SIV' });
    expect(normalizePlate(' ab-123 cd ')).toMatchObject({ ok: true, normalized: 'AB-123-CD' });
  });
  it('refuse les lettres interdites et le groupe 000', () => {
    expect(normalizePlate('IO-123-AB').ok).toBe(false);
    expect(normalizePlate('AB-000-CD').ok).toBe(false);
    expect(normalizePlate('AB-123-SS').ok).toBe(false);
  });
  it('accepte l’ancien format FNI', () => {
    expect(normalizePlate('1234 AB 88')).toMatchObject({ ok: true, format: 'FNI', normalized: '1234 AB 88' });
  });
  it('rejette les saisies non reconnues', () => {
    expect(normalizePlate('bonjour').ok).toBe(false);
  });
});

describe('zones et frais de déplacement', () => {
  const zone = defaultSettings(false).zone;
  it('calcule une distance à vol d’oiseau plausible (Rupt → Remiremont ≈ 11 km)', () => {
    const d = haversineKm({ lat: zone.baseLat, lon: zone.baseLon }, { lat: 48.0172, lon: 6.5911 });
    expect(d).toBeGreaterThan(9);
    expect(d).toBeLessThan(13);
  });
  it('applique les paliers', () => {
    expect(computeCoverage({ lat: zone.baseLat, lon: zone.baseLon }, zone)).toMatchObject({ status: 'served', feeCents: 0, distanceKm: 0 });
    const lure = computeCoverage({ lat: 47.6836, lon: 6.4967 }, zone);
    expect(lure.status).toBe('served');
    expect(lure.feeCents).toBe(2500);
  });
  it('hors rayon : sur demande ou refus selon la règle', () => {
    const far = { lat: 48.69, lon: 6.18 }; // Nancy
    expect(computeCoverage(far, zone).status).toBe('on_request');
    expect(computeCoverage(far, { ...zone, outsidePolicy: 'refuse' }).status).toBe('outside');
  });
  it('les exceptions communales priment', () => {
    expect(computeCoverage({ lat: zone.baseLat, lon: zone.baseLon }, zone, { status: 'excluded', travelFeeOverrideCents: null }).status).toBe('outside');
    expect(computeCoverage({ lat: zone.baseLat, lon: zone.baseLon }, zone, { status: 'served', travelFeeOverrideCents: 900 }).feeCents).toBe(900);
  });
});

describe('disponibilités', () => {
  const settings = defaultSettings(false).availability;
  it('gère le fuseau de Paris (heure d’été / d’hiver)', () => {
    expect(tzOffsetMinutes(new Date('2026-07-01T12:00:00Z'), 'Europe/Paris')).toBe(120);
    expect(tzOffsetMinutes(new Date('2026-12-01T12:00:00Z'), 'Europe/Paris')).toBe(60);
    expect(zonedToUtc('2026-12-01', '08:00', 'Europe/Paris').toISOString()).toBe('2026-12-01T07:00:00.000Z');
  });
  it('propose matin et après-midi en semaine, rien le dimanche, respecte le délai minimal', () => {
    const now = new Date('2026-11-02T07:00:00Z'); // lundi 8 h
    const w = computeWindows({ settings, now, durationMinutes: 60, busy: [], closures: [] });
    const monday = w.filter((x) => x.date === '2026-11-02');
    expect(monday).toHaveLength(2);
    expect(monday.every((x) => !x.available)).toBe(true); // < 24 h
    expect(w.filter((x) => x.date === '2026-11-08')).toHaveLength(0); // dimanche
    expect(w.find((x) => x.date === '2026-11-04' && x.label === 'Matin')?.available).toBe(true);
  });
  it('bloque un créneau occupé ou en congés', () => {
    const now = new Date('2026-11-02T07:00:00Z');
    const busy = [{ start: new Date('2026-11-04T07:00:00Z'), end: new Date('2026-11-04T11:00:00Z') }];
    const closures = [{ start: new Date('2026-11-05T00:00:00Z'), end: new Date('2026-11-05T23:00:00Z') }];
    const w = computeWindows({ settings, now, durationMinutes: 90, busy, closures });
    expect(w.find((x) => x.date === '2026-11-04' && x.label === 'Matin')?.available).toBe(false);
    expect(w.filter((x) => x.date === '2026-11-05').every((x) => !x.available)).toBe(true);
  });
});

describe('estimation', () => {
  const vidange: PricedService = { slug: 'v', name: 'Vidange', laborPriceCents: 6900, priceValidated: true, priceNote: '', isDiagnostic: false };
  const distrib: PricedService = { slug: 'd', name: 'Distribution', laborPriceCents: null, priceValidated: false, priceNote: '', isDiagnostic: false };
  const diag: PricedService = { slug: 'g', name: 'Diagnostic', laborPriceCents: 5900, priceValidated: true, priceNote: '', isDiagnostic: true };
  it('additionne main-d’œuvre validée et déplacement, pièces exclues', () => {
    const e = buildEstimate({ services: [vidange], unknownIssue: false, travelFeeCents: 1500, zoneStatus: 'served', demoPrices: false, disclaimer: '' });
    expect(e.knownTotalCents).toBe(8400);
    expect(e.partsExcluded).toBe(true);
    expect(e.kind).toBe('estimation');
  });
  it('n’invente aucun prix : devis personnalisé si non validé', () => {
    const e = buildEstimate({ services: [distrib], unknownIssue: false, travelFeeCents: 0, zoneStatus: 'served', demoPrices: false, disclaimer: '' });
    expect(e.kind).toBe('devis_personnalise');
    expect(e.knownTotalCents).toBeNull();
    expect(e.needsQuote).toBe(true);
  });
  it('« je ne sais pas » ajoute le diagnostic', () => {
    const e = buildEstimate({ services: [], unknownIssue: true, diagnosticService: diag, travelFeeCents: null, zoneStatus: 'on_request', demoPrices: true, disclaimer: '' });
    expect(e.lines[0].label).toBe('Diagnostic');
    expect(e.lines.find((l) => l.label === 'Déplacement')?.amountCents).toBeNull();
  });
});

describe('devis', () => {
  it('calcule HT / TVA / TTC à l’arrondi par ligne', () => {
    const lines = [{ quantity: 1.5, unitPriceHtCents: 5500, vatRate: 20 }, { quantity: 1, unitPriceHtCents: 1234, vatRate: 20 }];
    expect(computeTotals(lines, 'normal')).toEqual({ totalHtCents: 9484, totalVatCents: 1897, totalTtcCents: 11381 });
    expect(computeTotals(lines, 'franchise')).toEqual({ totalHtCents: 9484, totalVatCents: 0, totalTtcCents: 9484 });
  });
  it('détecte l’expiration', () => {
    expect(isQuoteExpired({ status: 'envoye', validUntil: new Date('2020-01-01') })).toBe(true);
    expect(isQuoteExpired({ status: 'accepte', validUntil: new Date('2020-01-01') })).toBe(false);
  });
});

describe('statuts de demande', () => {
  it('autorise les transitions prévues uniquement', () => {
    expect(canTransition('nouvelle', 'confirmee')).toBe(true);
    expect(canTransition('terminee', 'nouvelle')).toBe(false);
    expect(canTransition('annulee', 'a_etudier')).toBe(true);
  });
});

describe('validation des demandes', () => {
  const base = {
    idempotencyKey: 'abcdefghijklmnopqrstuv', vehicle: { source: 'manual', make: 'Renault', model: 'Clio' }, services: ['entretien-vidange'], unknownIssue: false,
    address: { street: '1 rue A', postcode: '88200', city: 'Remiremont' }, preferredSlots: [], contact: { name: 'Jean', phone: '0612345678' }, consent: true,
  };
  it('accepte une demande minimale', () => { expect(bookingInputSchema.safeParse(base).success).toBe(true); });
  it('exige une intervention ou « je ne sais pas »', () => { expect(bookingInputSchema.safeParse({ ...base, services: [] }).success).toBe(false); });
  it('exige le consentement', () => { expect(bookingInputSchema.safeParse({ ...base, consent: false }).success).toBe(false); });
  it('rejette un code postal invalide et un VIN mal formé', () => {
    expect(bookingInputSchema.safeParse({ ...base, address: { ...base.address, postcode: '882' } }).success).toBe(false);
    expect(bookingInputSchema.safeParse({ ...base, vehicle: { ...base.vehicle, vin: 'ABC' } }).success).toBe(false);
  });
  it('le champ piège anti-robots doit rester vide', () => { expect(bookingInputSchema.safeParse({ ...base, website: 'spam' }).success).toBe(false); });
});

describe('utilitaires', () => {
  it('normalise les numéros français', () => {
    expect(normalizeFrenchPhone('06 12 34 56 78')).toBe('0612345678');
    expect(normalizeFrenchPhone('+33 6 12 34 56 78')).toBe('0612345678');
    expect(normalizeFrenchPhone('12345')).toBeNull();
  });
  it('génère des slugs et références lisibles', () => {
    expect(slugify("Le Val-d'Ajol")).toBe('le-val-d-ajol');
    expect(bookingReference(new Date('2026-11-04'))).toMatch(/^VF-2611-[A-HJ-NP-Z2-9]{4}$/);
    expect(euros(6900)).toMatch(/69\s?€/);
  });
  it('identifie le type réel des images', () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('image/jpeg');
    expect(sniffImageType(new TextEncoder().encode('<svg onload=alert(1)>....'))).toBeNull();
  });
  it('produit un iCalendar valide', () => {
    const ics = buildIcs('Test', [{ uid: 'a@b', start: new Date('2026-11-05T09:00:00Z'), end: new Date('2026-11-05T10:00:00Z'), summary: 'Vidange, Clio', location: '1 rue A; Lure', description: 'x' }]);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20261105T090000Z');
    expect(ics).toContain('SUMMARY:Vidange\\, Clio');
  });
  it('classe les véhicules pour l’illustration 3D', () => {
    expect(categorize('Renault', 'Clio')).toBe('citadine');
    expect(categorize('Renault', 'Master')).toBe('utilitaire');
    expect(categorize('Inconnue', 'Modèle X SUV')).toBe('suv');
  });
  it('les paramètres par défaut sont valides', () => {
    const d = defaultSettings(true);
    for (const [k, schema] of Object.entries(settingsSchemas)) expect(schema.safeParse(d[k as keyof typeof d]).success).toBe(true);
  });
});
