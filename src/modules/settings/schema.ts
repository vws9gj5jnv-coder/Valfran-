import { z } from 'zod';

export const timeRange = z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) });

export const businessSchema = z.object({
  name: z.string().min(1).max(80),
  tagline: z.string().max(120),
  phone: z.string().max(30),
  email: z.string().max(120),
  addressLine: z.string().max(200),
  postcode: z.string().max(10),
  city: z.string().max(80),
  legalName: z.string().max(120),
  legalForm: z.string().max(120),
  siret: z.string().max(20),
  registration: z.string().max(120),
  vatNumber: z.string().max(30),
  publicationDirector: z.string().max(120),
  hostName: z.string().max(200),
  hostAddress: z.string().max(300),
  insurance: z.string().max(300),
  mediator: z.string().max(300),
  googleBusinessUrl: z.string().max(500),
  hours: z.array(z.object({ label: z.string().max(60), value: z.string().max(60) })).max(10),
  qualifications: z.array(z.string().max(200)).max(20),
  phoneIsPlaceholder: z.boolean(),
});

export const contentSchema = z.object({
  heroTitle: z.string().max(80),
  heroSubtitle: z.string().max(240),
  aboutTitle: z.string().max(120),
  aboutText: z.string().max(4000),
  bookingIntro: z.string().max(400),
  realisationsIntro: z.string().max(600),
});

export const pricingSchema = z.object({
  hourlyRateCents: z.number().int().min(0).max(100000),
  vatMode: z.enum(['franchise', 'normal']),
  vatRate: z.number().min(0).max(30),
  demoPrices: z.boolean(),
  quoteValidityDays: z.number().int().min(1).max(180),
  estimateDisclaimer: z.string().max(400),
});

export const zoneSchema = z.object({
  baseName: z.string().max(80),
  baseLat: z.number().min(-90).max(90),
  baseLon: z.number().min(-180).max(180),
  roadFactor: z.number().min(1).max(2),
  maxKm: z.number().min(1).max(300),
  tiers: z.array(z.object({ upToKm: z.number().min(0).max(300), feeCents: z.number().int().min(0).max(100000) })).max(10),
  outsidePolicy: z.enum(['on_request', 'refuse']),
});

export const availabilitySchema = z.object({
  /** Clé = jour ISO (1 = lundi … 7 = dimanche). */
  weekly: z.record(z.string(), z.array(timeRange).max(4)),
  minNoticeHours: z.number().int().min(0).max(24 * 14),
  daysAhead: z.number().int().min(3).max(90),
  timezone: z.string(),
});

export const notificationSchema = z.object({
  notifyAdminByEmail: z.boolean(),
  customerEmail: z.boolean(),
  customerSms: z.boolean(),
});

export const retentionSchema = z.object({
  prospectMonths: z.number().int().min(1).max(120),
  customerMonths: z.number().int().min(1).max(240),
});

export const settingsSchemas = {
  business: businessSchema,
  content: contentSchema,
  pricing: pricingSchema,
  zone: zoneSchema,
  availability: availabilitySchema,
  notifications: notificationSchema,
  retention: retentionSchema,
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type Settings = { [K in SettingsKey]: z.infer<(typeof settingsSchemas)[K]> };
export type BusinessSettings = Settings['business'];
export type ZoneSettings = Settings['zone'];
export type AvailabilitySettings = Settings['availability'];
export type PricingSettings = Settings['pricing'];
