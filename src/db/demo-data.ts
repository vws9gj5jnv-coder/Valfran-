/**
 * Données FICTIVES du mode démonstration. Toutes les lignes portent is_demo = true et sont signalées
 * « Démo » dans l'administration. Les numéros de téléphone utilisent la plage ARCEP réservée à la fiction.
 */
import { eq, sql } from 'drizzle-orm';
import type { DB } from './client';
import * as s from './schema';
import { newId, newToken, bookingReference } from '@/lib/ids';
import { hashPassword } from '@/modules/auth/password';
import { computeTotals } from '@/modules/quotes/totals';
import { env } from '@/lib/env';

export const DEMO_ADMIN_EMAIL = 'demo@valfran.example';
export const DEMO_ADMIN_PASSWORD_DEV = 'demo-valfran-2026';

export async function ensureDemoData(db: DB) {
  const flag = await db.select().from(s.counters).where(eq(s.counters.key, 'demo_seeded'));
  if (flag[0]) return;
  await db.insert(s.counters).values({ key: 'demo_seeded', value: 1 }).onConflictDoNothing();

  const password = process.env.DEMO_ADMIN_PASSWORD || (env.isProd ? '' : DEMO_ADMIN_PASSWORD_DEV);
  if (password) {
    await db.insert(s.adminUsers).values({ id: newId(), email: DEMO_ADMIN_EMAIL, name: 'Compte de démonstration', passwordHash: await hashPassword(password), isDemo: true }).onConflictDoNothing();
  }

  const day = (offset: number, h: number, m = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const people = [
    { name: 'Claire Exemple', phone: '0639980101', email: 'claire@exemple.invalid', street: '12 rue des Écoles', postcode: '88200', city: 'Remiremont' },
    { name: 'Thomas Démo', phone: '0639980102', email: '', street: '3 chemin du Moulin', postcode: '88360', city: 'Rupt-sur-Moselle' },
    { name: 'Nadia Fictif', phone: '0639980103', email: 'nadia@exemple.invalid', street: '45 avenue de la Gare', postcode: '70300', city: 'Luxeuil-les-Bains' },
    { name: 'Paul Essai', phone: '0639980104', email: '', street: '8 place du Marché', postcode: '88160', city: 'Le Thillot' },
    { name: 'Lucie Modèle', phone: '0639980105', email: 'lucie@exemple.invalid', street: '21 rue de la Libération', postcode: '70200', city: 'Lure' },
  ];
  const cars = [
    { make: 'Renault', model: 'Clio', year: 2017, engine: '1.5 dCi 90', fuel: 'Diesel', category: 'citadine', plate: 'AB-123-CD' },
    { make: 'Peugeot', model: '308', year: 2019, engine: '1.2 PureTech 130', fuel: 'Essence', category: 'compacte', plate: null },
    { make: 'Dacia', model: 'Duster', year: 2021, engine: '1.3 TCe 130', fuel: 'Essence', category: 'suv', plate: 'JK-789-LM' },
    { make: 'Renault', model: 'Kangoo', year: 2016, engine: '1.5 dCi 90', fuel: 'Diesel', category: 'utilitaire', plate: 'NP-321-QR' },
    { make: 'Toyota', model: 'Yaris', year: 2020, engine: 'Hybride 116', fuel: 'Hybride', category: 'citadine', plate: null },
  ];
  const plan = [
    { status: 'nouvelle', services: ['entretien-vidange'], created: day(0, 8, 12), sched: null, desc: 'Vidange annuelle, environ 98 000 km.' },
    { status: 'confirmee', services: ['freinage'], created: day(-2, 18), sched: day(1, 9), desc: 'Bruit de frottement à l’avant.' },
    { status: 'devis_necessaire', services: ['distribution'], created: day(-1, 11), sched: null, desc: 'Distribution à prévoir selon le carnet.' },
    { status: 'terminee', services: ['batterie-demarrage'], created: day(-9, 9), sched: day(-7, 14), desc: 'Ne démarre plus le matin.' },
    { status: 'annulee', services: ['diagnostic-electronique'], created: day(-5, 16), sched: null, desc: 'Voyant moteur orange.' },
  ];

  const bookingIds: string[] = [];
  const customerIds: string[] = [];
  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    const cid = newId();
    customerIds.push(cid);
    await db.insert(s.customers).values({ id: cid, name: p.name, phone: p.phone, email: p.email || null, address: p.street, postcode: p.postcode, city: p.city, isDemo: true, createdAt: plan[i].created });
    const vid = newId();
    await db.insert(s.vehicles).values({ id: vid, customerId: cid, plate: cars[i].plate, make: cars[i].make, model: cars[i].model, year: cars[i].year, engine: cars[i].engine, fuel: cars[i].fuel, category: cars[i].category, source: cars[i].plate ? 'plate' : 'manual' });
    const bid = newId();
    bookingIds.push(bid);
    const pl = plan[i];
    await db.insert(s.bookings).values({
      id: bid, reference: bookingReference(pl.created), publicToken: newToken(), status: pl.status, customerId: cid, vehicleId: vid,
      serviceSlugs: pl.services, description: pl.desc, address: p.street, postcode: p.postcode, city: p.city,
      zoneStatus: 'served', distanceKm: [12, 0, 31, 6, 41][i], travelFeeCents: [0, 0, 2500, 0, 2500][i], travelMinutes: [15, 5, 37, 8, 49][i],
      preferredSlots: [], scheduledStart: pl.sched, scheduledEnd: pl.sched ? new Date(pl.sched.getTime() + 90 * 60000) : null,
      cancelReason: pl.status === 'annulee' ? 'Le client a trouvé une autre solution.' : '', isDemo: true, createdAt: pl.created, updatedAt: pl.created,
    });
    await db.insert(s.bookingEvents).values({ bookingId: bid, type: 'created', toStatus: 'nouvelle', note: 'Demande de démonstration', actor: 'demo', createdAt: pl.created });
    if (pl.status !== 'nouvelle') await db.insert(s.bookingEvents).values({ bookingId: bid, type: 'status', fromStatus: 'nouvelle', toStatus: pl.status, actor: 'demo' });
  }

  // Devis de démonstration
  const year = new Date().getFullYear();
  const quotesPlan = [
    { idx: 2, status: 'envoye', title: 'Remplacement kit de distribution', lines: [
      { kind: 'piece', label: 'Kit de distribution avec pompe à eau (référence à préciser)', reference: '', quantity: 1, unitPriceHtCents: 21000 },
      { kind: 'main_oeuvre', label: 'Main-d’œuvre', reference: '', quantity: 4, unitPriceHtCents: 5500 },
      { kind: 'deplacement', label: 'Déplacement Luxeuil-les-Bains', reference: '', quantity: 1, unitPriceHtCents: 2500 },
    ] },
    { idx: 0, status: 'brouillon', title: 'Vidange et filtres', lines: [
      { kind: 'piece', label: 'Huile moteur 5W30 (5 L)', reference: '', quantity: 1, unitPriceHtCents: 4200 },
      { kind: 'piece', label: 'Filtre à huile', reference: '', quantity: 1, unitPriceHtCents: 1200 },
      { kind: 'main_oeuvre', label: 'Main-d’œuvre vidange', reference: '', quantity: 1, unitPriceHtCents: 6900 },
    ] },
  ];
  for (let q = 0; q < quotesPlan.length; q++) {
    const qp = quotesPlan[q];
    const totals = computeTotals(qp.lines.map((l) => ({ ...l, vatRate: 20 })), 'franchise');
    const qid = newId();
    const n = await db.execute<{ value: number }>(sql`insert into counters (key, value) values (${`quote-${year}`}, 1) on conflict (key) do update set value = counters.value + 1 returning value`);
    const value = Number((Array.isArray(n) ? n[0] : (n as unknown as { rows: { value: number }[] }).rows[0]).value);
    await db.insert(s.quotes).values({
      id: qid, number: `D-${year}-${String(value).padStart(4, '0')}`, publicToken: newToken(), status: qp.status, customerId: customerIds[qp.idx], bookingId: bookingIds[qp.idx],
      vehicleLabel: `${cars[qp.idx].make} ${cars[qp.idx].model} ${cars[qp.idx].engine}`, title: qp.title, vatMode: 'franchise',
      validUntil: day(30, 12), ...totals, sentAt: qp.status === 'envoye' ? day(-1, 15) : null, isDemo: true,
    });
    await db.insert(s.quoteLines).values(qp.lines.map((l, i) => ({ id: newId(), quoteId: qid, kind: l.kind, label: l.label, reference: l.reference, quantity: String(l.quantity), unitPriceHtCents: l.unitPriceHtCents, vatRate: '20', sortOrder: i })));
    await db.insert(s.quoteEvents).values({ quoteId: qid, type: 'created', actor: 'demo', note: 'Devis de démonstration' });
  }

  await db.insert(s.closures).values({ id: newId(), startsAt: day(10, 0), endsAt: day(11, 23, 59), kind: 'conges', reason: 'Congés (démonstration)' });
}
