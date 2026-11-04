// Simulation d'un appel API d'immatriculation (type SIV / Autodoc / etc.).
// Pour brancher une vraie API : remplacer le corps de `lookupPlate` par un fetch()
// vers votre backend (ne jamais exposer la clé API côté navigateur).

const CATALOG = [
  { brand: 'Renault', model: 'Clio V', category: 'Citadine', engine: '1.0 TCe 90', fuel: 'Essence', power: '90 ch', gearbox: 'Manuelle', y: [2019, 2024] },
  { brand: 'Peugeot', model: '208', category: 'Citadine', engine: '1.5 BlueHDi 100', fuel: 'Diesel', power: '100 ch', gearbox: 'Manuelle', y: [2019, 2024] },
  { brand: 'Citroën', model: 'C3', category: 'Citadine', engine: '1.2 PureTech 82', fuel: 'Essence', power: '82 ch', gearbox: 'Manuelle', y: [2017, 2023] },
  { brand: 'Volkswagen', model: 'Golf VII', category: 'Compacte', engine: '2.0 TDI 150', fuel: 'Diesel', power: '150 ch', gearbox: 'Manuelle', y: [2013, 2020] },
  { brand: 'Renault', model: 'Mégane IV', category: 'Compacte', engine: '1.5 dCi 110', fuel: 'Diesel', power: '110 ch', gearbox: 'Manuelle', y: [2016, 2022] },
  { brand: 'Peugeot', model: '308', category: 'Compacte', engine: '1.2 PureTech 130', fuel: 'Essence', power: '130 ch', gearbox: 'Automatique', y: [2014, 2021] },
  { brand: 'Toyota', model: 'Yaris Hybride', category: 'Citadine', engine: '1.5 Hybrid 116h', fuel: 'Hybride', power: '116 ch', gearbox: 'Automatique', y: [2020, 2024] },
  { brand: 'Dacia', model: 'Duster', category: 'SUV', engine: '1.5 Blue dCi 115', fuel: 'Diesel', power: '115 ch', gearbox: 'Manuelle', y: [2018, 2024] },
  { brand: 'Peugeot', model: '3008', category: 'SUV', engine: '1.5 BlueHDi 130', fuel: 'Diesel', power: '130 ch', gearbox: 'Automatique', y: [2017, 2023] },
  { brand: 'BMW', model: 'Série 3 (G20)', category: 'Berline', engine: '320d 190', fuel: 'Diesel', power: '190 ch', gearbox: 'Automatique', y: [2019, 2024] },
  { brand: 'Tesla', model: 'Model 3', category: 'Berline', engine: 'Propulsion', fuel: 'Électrique', power: '283 ch', gearbox: 'Automatique', y: [2019, 2024] },
  { brand: 'Renault', model: 'Trafic', category: 'Utilitaire', engine: '2.0 dCi 145', fuel: 'Diesel', power: '145 ch', gearbox: 'Manuelle', y: [2015, 2023] },
];

export const PLATE_RE = /^[A-HJ-NP-TV-Z]{2}-\d{3}-[A-HJ-NP-TV-Z]{2}$/;

/** Formate la saisie en AA-123-AA au fil de la frappe. */
export function formatPlate(raw) {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  return [s.slice(0, 2), s.slice(2, 5), s.slice(5, 7)].filter(Boolean).join('-');
}

export const isValidPlate = (p) => PLATE_RE.test(p);

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function lookupPlate(plate) {
  return new Promise((resolve, reject) => {
    const delay = 900 + (hash(plate) % 500);
    setTimeout(() => {
      if (!isValidPlate(plate)) return reject(new Error('Format de plaque invalide. Exemple : AB-123-CD'));
      const h = hash(plate);
      const car = CATALOG[h % CATALOG.length];
      const [y0, y1] = car.y;
      const year = y0 + ((h >> 4) % (y1 - y0 + 1));
      const age = Math.max(0.5, 2026 - year);
      const km = Math.round((age * 12500 + ((h >> 8) % 12000)) / 1000) * 1000;
      const month = 1 + ((h >> 12) % 12);
      resolve({
        plate,
        brand: car.brand,
        model: car.model,
        category: car.category,
        engine: car.engine,
        fuel: car.fuel,
        power: car.power,
        gearbox: car.gearbox,
        year,
        firstRegistration: `${String(month).padStart(2, '0')}/${year}`,
        mileage: km,
      });
    }, delay);
  });
}
