// Stock de démonstration. Remplacer par vos véhicules (ou une API/CMS).
// `color` sert à la silhouette générée ; ajoutez `photos: ['/img/…jpg']` pour de vraies photos.
export const VEHICLES = [
  {
    id: 'clio-v-tce-2021', brand: 'Renault', model: 'Clio V', version: 'Evolution TCe 90',
    price: 13490, year: 2021, km: 48200, fuel: 'Essence', gearbox: 'Manuelle', power: '90 ch', doors: 5, seats: 5,
    color: '#8f97a6', colorName: 'Gris Titanium', body: 'Citadine', crit: '1', owners: 1,
    options: ['Écran tactile 7"', 'Apple CarPlay / Android Auto', 'Régulateur limiteur', 'Radar de recul', 'Climatisation'],
    history: [
      { km: 15000, date: '03/2022', label: 'Révision + vidange' },
      { km: 32000, date: '04/2023', label: 'Révision + filtres + liquide de frein' },
      { km: 46500, date: '09/2024', label: 'Contrôle 40 points avant vente' },
    ],
  },
  {
    id: 'golf-7-tdi-2018', brand: 'Volkswagen', model: 'Golf VII', version: '2.0 TDI 150 Carat DSG',
    price: 16990, year: 2018, km: 112400, fuel: 'Diesel', gearbox: 'Automatique', power: '150 ch', doors: 5, seats: 5,
    color: '#2f6fe8', colorName: 'Bleu Atlantique', body: 'Compacte', crit: '2', owners: 2,
    options: ['Cockpit digital', 'GPS Discover Pro', 'Sièges chauffants', 'Caméra de recul', 'Phares LED'],
    history: [
      { km: 60000, date: '05/2020', label: 'Révision + vidange boîte DSG' },
      { km: 95000, date: '11/2022', label: 'Plaquettes + disques avant' },
      { km: 110000, date: '10/2024', label: 'Distribution + pompe à eau' },
    ],
  },
  {
    id: 'duster-2020', brand: 'Dacia', model: 'Duster', version: 'Blue dCi 115 4x2 Prestige',
    price: 15490, year: 2020, km: 74800, fuel: 'Diesel', gearbox: 'Manuelle', power: '115 ch', doors: 5, seats: 5,
    color: '#3a4150', colorName: 'Noir Nacré', body: 'SUV', crit: '2', owners: 1,
    options: ['Caméra multi-vues', 'Barres de toit', 'Aide au stationnement', 'Écran Media Nav', 'Jantes alliage 17"'],
    history: [
      { km: 30000, date: '06/2021', label: 'Révision constructeur' },
      { km: 60000, date: '07/2023', label: 'Révision + filtres' },
      { km: 74000, date: '10/2024', label: 'Contrôle pré-vente + pneus neufs' },
    ],
  },
  {
    id: '3008-2019', brand: 'Peugeot', model: '3008', version: 'BlueHDi 130 GT Line EAT8',
    price: 21900, year: 2019, km: 89300, fuel: 'Diesel', gearbox: 'Automatique', power: '130 ch', doors: 5, seats: 5,
    color: '#d9dde4', colorName: 'Blanc Nacré', body: 'SUV', crit: '2', owners: 1,
    options: ['i-Cockpit', 'Toit panoramique', 'Hayon mains libres', 'Alerte angle mort', 'Sièges massants'],
    history: [
      { km: 30000, date: '05/2020', label: 'Révision constructeur' },
      { km: 62000, date: '06/2022', label: 'Révision + vidange boîte' },
      { km: 88000, date: '09/2024', label: 'Révision complète + freins' },
    ],
  },
  {
    id: 'yaris-hybrid-2022', brand: 'Toyota', model: 'Yaris', version: 'Hybride 116h Design',
    price: 18490, year: 2022, km: 31500, fuel: 'Hybride', gearbox: 'Automatique', power: '116 ch', doors: 5, seats: 5,
    color: '#ff7a29', colorName: 'Orange Sunset', body: 'Citadine', crit: '1', owners: 1,
    options: ['Garantie batterie hybride', 'Toyota Safety Sense', 'Écran 8"', 'Caméra de recul', 'Clim automatique'],
    history: [
      { km: 15000, date: '04/2023', label: 'Révision constructeur' },
      { km: 30000, date: '05/2024', label: 'Révision + contrôle batterie hybride' },
    ],
  },
  {
    id: 'bmw-320d-2019', brand: 'BMW', model: 'Série 3', version: '320d 190 M Sport BVA8',
    price: 28900, year: 2019, km: 96700, fuel: 'Diesel', gearbox: 'Automatique', power: '190 ch', doors: 4, seats: 5,
    color: '#11141a', colorName: 'Noir Saphir', body: 'Berline', crit: '2', owners: 2,
    options: ['Cuir Vernasca', 'Pack M Sport', 'Head-up display', 'Harman Kardon', 'Régulateur adaptatif'],
    history: [
      { km: 40000, date: '03/2021', label: 'Service BMW' },
      { km: 75000, date: '08/2023', label: 'Vidange + filtres + liquide de frein' },
      { km: 95000, date: '10/2024', label: 'Contrôle 60 points + pneus neufs' },
    ],
  },
];

export const getVehicle = (id) => VEHICLES.find((v) => v.id === id);
