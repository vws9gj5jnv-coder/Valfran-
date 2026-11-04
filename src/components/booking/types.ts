import type { IdentifiedVehicle } from '@/modules/plates/types';

export interface PublicService {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  includes: string[];
  requirements: string[];
  infoNeeded: string[];
  laborPriceCents: number | null;
  priceValidated: boolean;
  priceNote: string;
  isDiagnostic: boolean;
  durationMinutes: number;
}

export interface VehicleState {
  source: 'plate' | 'manual';
  plate: string;
  identified: IdentifiedVehicle | null;
  make: string;
  model: string;
  year: number | null;
  fuel: string;
  engine: string;
  vin: string;
}

export interface AddressState {
  street: string;
  postcode: string;
  city: string;
  check: { status: 'served' | 'on_request' | 'outside' | 'unknown'; distanceKm: number | null; feeCents: number | null; message: string } | null;
}

export interface Draft {
  version: 1;
  savedAt: number;
  step: number;
  idempotencyKey: string;
  vehicle: VehicleState;
  services: string[];
  unknownIssue: boolean;
  description: string;
  attachments: { id: string; name: string; size: number }[];
  address: AddressState;
  slots: string[];
  availabilityNote: string;
  contact: { name: string; phone: string; email: string; preference: 'phone' | 'sms' | 'email' };
  consent: boolean;
}

export const emptyDraft = (key: string): Draft => ({
  version: 1,
  savedAt: Date.now(),
  step: 0,
  idempotencyKey: key,
  vehicle: { source: 'plate', plate: '', identified: null, make: '', model: '', year: null, fuel: '', engine: '', vin: '' },
  services: [],
  unknownIssue: false,
  description: '',
  attachments: [],
  address: { street: '', postcode: '', city: '', check: null },
  slots: [],
  availabilityNote: '',
  contact: { name: '', phone: '', email: '', preference: 'phone' },
  consent: false,
});

export interface WizardConfig {
  services: PublicService[];
  makes: Record<string, string[]>;
  fuels: readonly string[];
  demo: boolean;
  demoPlates: string[];
  demoPrices: boolean;
  estimateDisclaimer: string;
  phone: string;
  phoneHref: string;
  maxKm: number;
  baseName: string;
}
