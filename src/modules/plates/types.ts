import type { VehicleCategory } from '@/modules/vehicles/catalog';

export interface IdentifiedVehicle {
  make: string;
  model: string;
  version?: string;
  year?: number;
  fuel?: string;
  engine?: string;
  category: VehicleCategory;
}

export type PlateLookupResult =
  | { status: 'found'; vehicles: IdentifiedVehicle[]; provider: string; demo: boolean }
  | { status: 'not_found'; demo: boolean }
  | { status: 'invalid'; reason: string }
  | { status: 'unavailable'; demo: boolean }
  | { status: 'quota'; demo: boolean }
  | { status: 'rate_limited'; retryAfterSec: number }
  | { status: 'disabled' };

export interface PlateProvider {
  readonly name: string;
  readonly demo: boolean;
  lookup(normalizedPlate: string, signal?: AbortSignal): Promise<PlateLookupResult>;
}
