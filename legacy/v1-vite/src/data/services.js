export const SERVICES = [
  {
    id: 'vidange', label: 'Vidange / Entretien', icon: 'Droplets',
    desc: 'Huile moteur, filtre à huile, contrôle des niveaux et des points de sécurité.',
    hours: 0.75, parts: 55,
    addons: [
      { id: 'filtre-air', label: 'Filtre à air', price: 22 },
      { id: 'filtre-habitacle', label: 'Filtre d\'habitacle', price: 18 },
      { id: 'liquide-frein', label: 'Purge liquide de frein', price: 35 },
    ],
  },
  {
    id: 'freinage', label: 'Freinage', icon: 'Disc3',
    desc: 'Plaquettes, disques et contrôle complet du circuit de freinage.',
    hours: 1.5, parts: 90,
    addons: [
      { id: 'disques-av', label: 'Disques avant', price: 110 },
      { id: 'plaquettes-ar', label: 'Plaquettes arrière', price: 70 },
      { id: 'disques-ar', label: 'Disques arrière', price: 95 },
    ],
  },
  {
    id: 'distribution', label: 'Distribution', icon: 'Cog',
    desc: 'Kit de distribution complet. Remplacement préventif selon préconisations constructeur.',
    hours: 3.5, parts: 190,
    addons: [
      { id: 'pompe-eau', label: 'Pompe à eau', price: 65 },
      { id: 'courroie-acc', label: 'Courroie d\'accessoires', price: 45 },
    ],
    notFor: { fuel: ['Électrique'], reason: 'Les véhicules électriques n\'ont pas de courroie de distribution.' },
  },
  {
    id: 'diagnostic', label: 'Diagnostic électronique', icon: 'ScanLine',
    desc: 'Lecture des défauts, analyse des données moteur et diagnostic de panne avec valise de pointe.',
    hours: 1, parts: 0,
    addons: [
      { id: 'rapport', label: 'Rapport écrit détaillé', price: 0 },
      { id: 'pre-achat', label: 'Contrôle pré-achat complet', price: 40 },
    ],
  },
  {
    id: 'pneus', label: 'Pneus', icon: 'CircleDot',
    desc: 'Fourniture et remplacement des 4 pneus (milieu de gamme), montage et équilibrage.',
    hours: 1.25, parts: 240,
    addons: [{ id: 'geometrie', label: 'Contrôle de parallélisme', price: 30 }],
  },
  {
    id: 'autre', label: 'Autre intervention', icon: 'Wrench',
    desc: 'Embrayage, batterie, climatisation, amortisseurs… Décrivez votre besoin, devis ferme sous 24 h.',
    hours: 1, parts: 0, quote: true, addons: [],
  },
];

export const getService = (id) => SERVICES.find((s) => s.id === id);
