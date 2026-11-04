import { pgTable, text, integer, boolean, timestamp, jsonb, doublePrecision, uniqueIndex, index, serial, numeric } from 'drizzle-orm/pg-core';

const id = () => text('id').primaryKey();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

/** Paramètres clé/valeur (coordonnées, textes, tarification, zone, disponibilités…). */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: updatedAt(),
});

export const services = pgTable('services', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  shortDescription: text('short_description').notNull(),
  description: text('description').notNull(),
  includes: jsonb('includes').$type<string[]>().notNull().default([]),
  requirements: jsonb('requirements').$type<string[]>().notNull().default([]),
  infoNeeded: jsonb('info_needed').$type<string[]>().notNull().default([]),
  garageZones: jsonb('garage_zones').$type<string[]>().notNull().default([]),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  /** Prix indicatif de main-d'œuvre en centimes TTC (null = pas d'estimation publique). */
  laborPriceCents: integer('labor_price_cents'),
  /** Indique si le prix a été validé par l'entreprise. Sinon : « Devis personnalisé après vérification ». */
  priceValidated: boolean('price_validated').notNull().default(false),
  priceNote: text('price_note').notNull().default(''),
  partsIncluded: boolean('parts_included').notNull().default(false),
  isDiagnostic: boolean('is_diagnostic').notNull().default(false),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  seoTitle: text('seo_title').notNull().default(''),
  seoDescription: text('seo_description').notNull().default(''),
  updatedAt: updatedAt(),
});

export const communes = pgTable('communes', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  postcode: text('postcode').notNull(),
  department: text('department').notNull(),
  lat: doublePrecision('lat').notNull(),
  lon: doublePrecision('lon').notNull(),
  /** served | on_request | excluded */
  status: text('status').notNull().default('served'),
  travelFeeOverrideCents: integer('travel_fee_override_cents'),
  featured: boolean('featured').notNull().default(false),
  localIntro: text('local_intro').notNull().default(''),
});

export const closures = pgTable('closures', {
  id: id(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  kind: text('kind').notNull().default('indisponibilite'), // conges | indisponibilite
  reason: text('reason').notNull().default(''),
  createdAt: createdAt(),
});

export const customers = pgTable('customers', {
  id: id(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address').notNull().default(''),
  postcode: text('postcode').notNull().default(''),
  city: text('city').notNull().default(''),
  notes: text('notes').notNull().default(''),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  anonymizedAt: timestamp('anonymized_at', { withTimezone: true }),
}, (t) => [index('customers_phone_idx').on(t.phone)]);

export const vehicles = pgTable('vehicles', {
  id: id(),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  plate: text('plate'),
  vin: text('vin'),
  make: text('make').notNull().default(''),
  model: text('model').notNull().default(''),
  year: integer('year'),
  engine: text('engine').notNull().default(''),
  fuel: text('fuel').notNull().default(''),
  category: text('category').notNull().default('compacte'),
  source: text('source').notNull().default('manual'), // plate | manual
  lookupProvider: text('lookup_provider'),
  createdAt: createdAt(),
});

export const bookings = pgTable('bookings', {
  id: id(),
  reference: text('reference').notNull().unique(),
  publicToken: text('public_token').notNull().unique(),
  status: text('status').notNull().default('nouvelle'),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  vehicleId: text('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  serviceSlugs: jsonb('service_slugs').$type<string[]>().notNull().default([]),
  unknownIssue: boolean('unknown_issue').notNull().default(false),
  description: text('description').notNull().default(''),
  address: text('address').notNull(),
  postcode: text('postcode').notNull().default(''),
  city: text('city').notNull().default(''),
  lat: doublePrecision('lat'),
  lon: doublePrecision('lon'),
  distanceKm: doublePrecision('distance_km'),
  zoneStatus: text('zone_status').notNull().default('served'),
  travelFeeCents: integer('travel_fee_cents'),
  estimate: jsonb('estimate'),
  preferredSlots: jsonb('preferred_slots').$type<string[]>().notNull().default([]),
  availabilityNote: text('availability_note').notNull().default(''),
  scheduledStart: timestamp('scheduled_start', { withTimezone: true }),
  scheduledEnd: timestamp('scheduled_end', { withTimezone: true }),
  travelMinutes: integer('travel_minutes'),
  internalNotes: text('internal_notes').notNull().default(''),
  cancelReason: text('cancel_reason').notNull().default(''),
  contactPreference: text('contact_preference').notNull().default('phone'),
  idempotencyKey: text('idempotency_key').unique(),
  source: text('source').notNull().default('site'),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('bookings_status_idx').on(t.status), index('bookings_sched_idx').on(t.scheduledStart)]);

export const bookingEvents = pgTable('booking_events', {
  id: serial('id').primaryKey(),
  bookingId: text('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  fromStatus: text('from_status'),
  toStatus: text('to_status'),
  note: text('note').notNull().default(''),
  actor: text('actor').notNull().default('system'),
  createdAt: createdAt(),
});

export const attachments = pgTable('attachments', {
  id: id(),
  bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  realisationId: text('realisation_id'),
  storageKey: text('storage_key').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  originalName: text('original_name').notNull().default(''),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: createdAt(),
});

export const quotes = pgTable('quotes', {
  id: id(),
  number: text('number').notNull().unique(),
  publicToken: text('public_token').notNull().unique(),
  status: text('status').notNull().default('brouillon'), // brouillon | envoye | accepte | refuse | expire
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  vehicleLabel: text('vehicle_label').notNull().default(''),
  title: text('title').notNull().default(''),
  notes: text('notes').notNull().default(''),
  vatMode: text('vat_mode').notNull().default('franchise'), // franchise | normal
  validUntil: timestamp('valid_until', { withTimezone: true }),
  totalHtCents: integer('total_ht_cents').notNull().default(0),
  totalVatCents: integer('total_vat_cents').notNull().default(0),
  totalTtcCents: integer('total_ttc_cents').notNull().default(0),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  acceptedByName: text('accepted_by_name'),
  acceptedIpHash: text('accepted_ip_hash'),
  acceptedUserAgent: text('accepted_user_agent'),
  refusedAt: timestamp('refused_at', { withTimezone: true }),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const quoteLines = pgTable('quote_lines', {
  id: id(),
  quoteId: text('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // piece | main_oeuvre | deplacement | autre
  label: text('label').notNull(),
  reference: text('reference').notNull().default(''),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPriceHtCents: integer('unit_price_ht_cents').notNull().default(0),
  vatRate: numeric('vat_rate', { precision: 5, scale: 2 }).notNull().default('20'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const quoteEvents = pgTable('quote_events', {
  id: serial('id').primaryKey(),
  quoteId: text('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  note: text('note').notNull().default(''),
  actor: text('actor').notNull().default('system'),
  createdAt: createdAt(),
});

export const faqs = pgTable('faqs', {
  id: id(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const realisations = pgTable('realisations', {
  id: id(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  serviceSlug: text('service_slug'),
  commune: text('commune').notNull().default(''),
  date: timestamp('date', { withTimezone: true }),
  published: boolean('published').notNull().default(false),
  createdAt: createdAt(),
});

/** Avis authentiques uniquement, saisis par l'entreprise avec leur source (Google, etc.). */
export const testimonials = pgTable('testimonials', {
  id: id(),
  author: text('author').notNull(),
  rating: integer('rating'),
  text: text('text').notNull(),
  source: text('source').notNull(),
  sourceUrl: text('source_url').notNull().default(''),
  date: timestamp('date', { withTimezone: true }),
  published: boolean('published').notNull().default(false),
});

export const adminUsers = pgTable('admin_users', {
  id: id(),
  email: text('email').notNull(),
  name: text('name').notNull().default(''),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('admin'),
  isDemo: boolean('is_demo').notNull().default(false),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('admin_users_email_idx').on(t.email)]);

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(), // SHA-256 du jeton
  userId: text('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  userAgent: text('user_agent').notNull().default(''),
});

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  count: integer('count').notNull().default(0),
});

export const notifications = pgTable('notifications', {
  id: id(),
  channel: text('channel').notNull(), // email | sms
  recipient: text('recipient').notNull(),
  subject: text('subject').notNull().default(''),
  body: text('body').notNull(),
  /** simulated | sent | failed | disabled */
  status: text('status').notNull(),
  provider: text('provider').notNull(),
  error: text('error').notNull().default(''),
  bookingId: text('booking_id'),
  quoteId: text('quote_id'),
  createdAt: createdAt(),
});

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull().default(''),
  createdAt: createdAt(),
});

export const counters = pgTable('counters', {
  key: text('key').primaryKey(),
  value: integer('value').notNull().default(0),
});
