import { z } from 'zod';

/** Schéma partagé navigateur / serveur. La validation serveur fait foi. */
export const bookingInputSchema = z
  .object({
    idempotencyKey: z.string().min(16).max(64).regex(/^[A-Za-z0-9_-]+$/),
    vehicle: z.object({
      source: z.enum(['plate', 'manual']),
      plate: z.string().max(12).optional().default(''),
      make: z.string().trim().min(1, 'Indiquez la marque').max(40),
      model: z.string().trim().min(1, 'Indiquez le modèle').max(60),
      year: z.number().int().min(1950).max(2100).nullable().optional(),
      engine: z.string().trim().max(80).optional().default(''),
      fuel: z.string().trim().max(40).optional().default(''),
      vin: z.string().trim().toUpperCase().regex(/^([A-HJ-NPR-Z0-9]{17})?$/, 'Le numéro VIN comporte 17 caractères (case E de la carte grise).').optional().default(''),
    }),
    services: z.array(z.string().max(60)).max(6),
    unknownIssue: z.boolean(),
    description: z.string().trim().max(2000).default(''),
    address: z.object({
      street: z.string().trim().min(3, 'Indiquez le numéro et la rue').max(200),
      postcode: z.string().trim().regex(/^\d{5}$/, 'Code postal à 5 chiffres'),
      city: z.string().trim().min(1, 'Indiquez la commune').max(80),
    }),
    preferredSlots: z.array(z.string().datetime()).max(3),
    availabilityNote: z.string().trim().max(500).default(''),
    contact: z.object({
      name: z.string().trim().min(2, 'Indiquez votre nom').max(100),
      phone: z.string().trim().min(10, 'Numéro de téléphone incomplet').max(20),
      email: z.union([z.literal(''), z.string().trim().email('Adresse e-mail invalide').max(120)]).default(''),
      preference: z.enum(['phone', 'sms', 'email']).default('phone'),
    }),
    consent: z.literal(true, { message: 'Votre accord est nécessaire pour traiter la demande.' }),
    attachmentIds: z.array(z.string().uuid()).max(5).default([]),
    website: z.string().max(0).optional().default(''), // champ piège anti-robots (doit rester vide)
  })
  .refine((v) => v.services.length > 0 || v.unknownIssue, { message: 'Choisissez au moins une intervention.', path: ['services'] })
  .refine((v) => v.contact.preference !== 'email' || v.contact.email !== '', { message: 'Indiquez votre e-mail pour être contacté par e-mail.', path: ['contact', 'email'] });

export type BookingInput = z.input<typeof bookingInputSchema>;
export type BookingData = z.output<typeof bookingInputSchema>;
