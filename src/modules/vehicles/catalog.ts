/**
 * Référentiel simplifié pour l'identification manuelle. Les noms de marques et modèles servent uniquement
 * à décrire le véhicule du client (texte). La catégorie choisit l'illustration 3D générique du garage virtuel.
 * Ce n'est pas une base technique : la motorisation exacte est confirmée avec le client (ou via le VIN).
 */
export type VehicleCategory = 'citadine' | 'compacte' | 'suv' | 'utilitaire';

export const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  citadine: 'Citadine',
  compacte: 'Berline compacte',
  suv: 'SUV familial',
  utilitaire: 'Utilitaire léger',
};

type M = [string, VehicleCategory];
export const MAKES: Record<string, M[]> = {
  Renault: [['Clio', 'citadine'], ['Twingo', 'citadine'], ['Zoe', 'citadine'], ['Mégane', 'compacte'], ['Scénic', 'suv'], ['Captur', 'suv'], ['Kadjar', 'suv'], ['Austral', 'suv'], ['Arkana', 'suv'], ['Kangoo', 'utilitaire'], ['Trafic', 'utilitaire'], ['Master', 'utilitaire'], ['Laguna', 'compacte'], ['Talisman', 'compacte']],
  Peugeot: [['108', 'citadine'], ['208', 'citadine'], ['308', 'compacte'], ['408', 'compacte'], ['508', 'compacte'], ['2008', 'suv'], ['3008', 'suv'], ['5008', 'suv'], ['Partner', 'utilitaire'], ['Rifter', 'utilitaire'], ['Expert', 'utilitaire'], ['Boxer', 'utilitaire'], ['207', 'citadine'], ['307', 'compacte']],
  Citroën: [['C1', 'citadine'], ['C3', 'citadine'], ['C4', 'compacte'], ['C5 Aircross', 'suv'], ['C3 Aircross', 'suv'], ['Berlingo', 'utilitaire'], ['Jumpy', 'utilitaire'], ['Jumper', 'utilitaire'], ['C5', 'compacte'], ['Picasso', 'suv']],
  Dacia: [['Sandero', 'citadine'], ['Spring', 'citadine'], ['Logan', 'compacte'], ['Jogger', 'suv'], ['Duster', 'suv'], ['Dokker', 'utilitaire'], ['Lodgy', 'suv']],
  Volkswagen: [['Polo', 'citadine'], ['Up!', 'citadine'], ['Golf', 'compacte'], ['Passat', 'compacte'], ['T-Roc', 'suv'], ['Tiguan', 'suv'], ['Touran', 'suv'], ['Caddy', 'utilitaire'], ['Transporter', 'utilitaire'], ['Crafter', 'utilitaire']],
  Toyota: [['Aygo', 'citadine'], ['Yaris', 'citadine'], ['Corolla', 'compacte'], ['Auris', 'compacte'], ['C-HR', 'suv'], ['RAV4', 'suv'], ['Proace', 'utilitaire'], ['Hilux', 'utilitaire']],
  Ford: [['Ka', 'citadine'], ['Fiesta', 'citadine'], ['Focus', 'compacte'], ['Mondeo', 'compacte'], ['Puma', 'suv'], ['Kuga', 'suv'], ['Transit', 'utilitaire'], ['Transit Connect', 'utilitaire']],
  Opel: [['Corsa', 'citadine'], ['Astra', 'compacte'], ['Insignia', 'compacte'], ['Mokka', 'suv'], ['Crossland', 'suv'], ['Grandland', 'suv'], ['Combo', 'utilitaire'], ['Vivaro', 'utilitaire'], ['Movano', 'utilitaire']],
  Fiat: [['500', 'citadine'], ['Panda', 'citadine'], ['Punto', 'citadine'], ['Tipo', 'compacte'], ['500X', 'suv'], ['Doblo', 'utilitaire'], ['Ducato', 'utilitaire'], ['Fiorino', 'utilitaire']],
  Nissan: [['Micra', 'citadine'], ['Leaf', 'compacte'], ['Juke', 'suv'], ['Qashqai', 'suv'], ['X-Trail', 'suv'], ['NV200', 'utilitaire']],
  Skoda: [['Fabia', 'citadine'], ['Octavia', 'compacte'], ['Superb', 'compacte'], ['Kamiq', 'suv'], ['Karoq', 'suv'], ['Kodiaq', 'suv']],
  Seat: [['Ibiza', 'citadine'], ['Leon', 'compacte'], ['Arona', 'suv'], ['Ateca', 'suv']],
  Hyundai: [['i10', 'citadine'], ['i20', 'citadine'], ['i30', 'compacte'], ['Kona', 'suv'], ['Tucson', 'suv']],
  Kia: [['Picanto', 'citadine'], ['Rio', 'citadine'], ['Ceed', 'compacte'], ['Niro', 'suv'], ['Sportage', 'suv']],
  BMW: [['Série 1', 'compacte'], ['Série 3', 'compacte'], ['Série 5', 'compacte'], ['X1', 'suv'], ['X3', 'suv']],
  Mercedes: [['Classe A', 'compacte'], ['Classe C', 'compacte'], ['GLA', 'suv'], ['GLC', 'suv'], ['Citan', 'utilitaire'], ['Vito', 'utilitaire'], ['Sprinter', 'utilitaire']],
  Audi: [['A1', 'citadine'], ['A3', 'compacte'], ['A4', 'compacte'], ['Q2', 'suv'], ['Q3', 'suv'], ['Q5', 'suv']],
  Suzuki: [['Swift', 'citadine'], ['Ignis', 'citadine'], ['Vitara', 'suv'], ['S-Cross', 'suv']],
  Mini: [['Mini', 'citadine'], ['Countryman', 'suv']],
  Mazda: [['Mazda2', 'citadine'], ['Mazda3', 'compacte'], ['CX-30', 'suv'], ['CX-5', 'suv']],
  Volvo: [['V40', 'compacte'], ['XC40', 'suv'], ['XC60', 'suv']],
  Honda: [['Jazz', 'citadine'], ['Civic', 'compacte'], ['HR-V', 'suv'], ['CR-V', 'suv']],
  Tesla: [['Model 3', 'compacte'], ['Model Y', 'suv']],
  MG: [['MG3', 'citadine'], ['MG4', 'compacte'], ['ZS', 'suv'], ['HS', 'suv']],
  Iveco: [['Daily', 'utilitaire']],
};

export const FUELS = ['Essence', 'Diesel', 'Hybride', 'Hybride rechargeable', 'Électrique', 'GPL', 'Autre'] as const;

export function categorize(make: string, model: string): VehicleCategory {
  const list = MAKES[make];
  const m = list?.find(([name]) => name.toLowerCase() === model.trim().toLowerCase());
  if (m) return m[1];
  const t = `${make} ${model}`.toLowerCase();
  if (/(fourgon|van|utilitaire|master|transit|ducato|boxer|jumper|sprinter|kangoo|partner|berlingo|caddy|daily)/.test(t)) return 'utilitaire';
  if (/(suv|cross|x\d|q\d|tiguan|duster|qashqai|\d008)/.test(t)) return 'suv';
  return 'compacte';
}

export function vehicleLabel(v: { make?: string | null; model?: string | null; year?: number | null; engine?: string | null }) {
  return [v.make, v.model, v.engine, v.year ? `(${v.year})` : ''].filter(Boolean).join(' ').trim() || 'Véhicule non précisé';
}
