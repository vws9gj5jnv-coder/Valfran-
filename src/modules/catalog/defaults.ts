/**
 * Catalogue initial des prestations. Tous les champs sont modifiables dans l'administration.
 * Les prix indiqués sont des valeurs de DÉMONSTRATION : ils ne sont affichés comme estimation que si
 * `priceValidated` est vrai (en mode démo, avec la mention « Tarif de démonstration »).
 */
export type GarageZone = 'moteur' | 'batterie' | 'freinage' | 'pneumatiques' | 'suspension' | 'direction' | 'transmission' | 'refroidissement';

export interface ServiceSeed {
  slug: string; name: string; category: string; shortDescription: string; description: string;
  includes: string[]; requirements: string[]; infoNeeded: string[]; garageZones: GarageZone[];
  durationMinutes: number; laborPriceCents: number | null; priceNote: string; partsIncluded?: boolean; isDiagnostic?: boolean;
  seoTitle: string; seoDescription: string;
}

const FLAT = 'Un sol plat et stable (cour, parking, allée), accessible au véhicule.';
const SPACE = 'Environ un mètre d’espace libre autour du véhicule.';

export const SERVICE_SEEDS: ServiceSeed[] = [
  {
    slug: 'entretien-vidange', name: 'Entretien et vidange', category: 'Entretien',
    shortDescription: 'Vidange, filtres et contrôle des points de sécurité.',
    description: 'Remplacement de l’huile moteur et du filtre à huile selon les préconisations de votre véhicule, remplacement des filtres si nécessaire et contrôle visuel des principaux points de sécurité.',
    includes: ['Huile moteur adaptée à votre véhicule', 'Filtre à huile', 'Contrôle des niveaux', 'Contrôle visuel des pneus, freins et éclairage', 'Récupération des huiles usagées'],
    requirements: [FLAT, SPACE],
    infoNeeded: ['Kilométrage approximatif', 'Date du dernier entretien si vous la connaissez'],
    garageZones: ['moteur', 'refroidissement'], durationMinutes: 60, laborPriceCents: 6900,
    priceNote: 'Main-d’œuvre. Huile et filtres selon véhicule, chiffrés au devis.',
    seoTitle: 'Vidange et entretien auto à domicile — Vosges et Haute-Saône',
    seoDescription: 'Vidange et entretien de votre voiture à domicile autour de Remiremont, Le Thillot et Luxeuil-les-Bains. Demande de rendez-vous en ligne en deux minutes.',
  },
  {
    slug: 'diagnostic-electronique', name: 'Diagnostic électronique', category: 'Diagnostic',
    shortDescription: 'Voyant allumé, comportement anormal : lecture et analyse des défauts.',
    description: 'Lecture des codes défauts avec un outil de diagnostic multimarque, analyse des valeurs moteur et des symptômes décrits, puis explication claire des causes probables et des réparations possibles.',
    includes: ['Lecture des calculateurs accessibles', 'Analyse des paramètres en fonctionnement', 'Compte rendu oral et écrit', 'Proposition de réparation chiffrée si nécessaire'],
    requirements: [FLAT],
    infoNeeded: ['Description des symptômes', 'Voyants allumés (une photo du tableau de bord aide beaucoup)'],
    garageZones: ['moteur', 'transmission'], durationMinutes: 60, laborPriceCents: 5900, isDiagnostic: true,
    priceNote: 'Forfait diagnostic. Les réparations éventuelles font l’objet d’un devis.',
    seoTitle: 'Diagnostic automobile à domicile — Remiremont, Le Thillot, Lure',
    seoDescription: 'Voyant moteur, perte de puissance, bruit anormal : diagnostic électronique multimarque à domicile dans les Vosges et en Haute-Saône.',
  },
  {
    slug: 'freinage', name: 'Freinage', category: 'Sécurité',
    shortDescription: 'Plaquettes, disques, liquide de frein : contrôle et remplacement.',
    description: 'Contrôle et remplacement des composants de freinage selon votre véhicule : plaquettes, disques, liquide de frein, et contrôle des étriers et flexibles.',
    includes: ['Contrôle de l’usure des plaquettes et disques', 'Remplacement des pièces nécessaires', 'Contrôle des étriers et flexibles', 'Essai de freinage après intervention'],
    requirements: [FLAT, SPACE, 'Le véhicule doit pouvoir être levé en toute sécurité : pas de pente ni de sol meuble.'],
    infoNeeded: ['Avant, arrière ou les deux si vous le savez', 'Bruits ou vibrations constatés'],
    garageZones: ['freinage'], durationMinutes: 90, laborPriceCents: 7900,
    priceNote: 'Main-d’œuvre par essieu. Pièces selon véhicule, chiffrées au devis.',
    seoTitle: 'Changement de plaquettes et disques de frein à domicile — Vosges',
    seoDescription: 'Remplacement des plaquettes, disques et liquide de frein à domicile autour de Rupt-sur-Moselle, Remiremont et Le Val-d’Ajol.',
  },
  {
    slug: 'pneumatiques', name: 'Pneumatiques', category: 'Sécurité',
    shortDescription: 'Montage, équilibrage, permutation et passage été / hiver.',
    description: 'Montage et équilibrage de pneumatiques sur place, permutation et changement de jeu de roues été / hiver. Les pneus peuvent être fournis ou commandés pour vous.',
    includes: ['Démontage et montage', 'Équilibrage', 'Contrôle de la pression', 'Valves si nécessaire'],
    requirements: [FLAT, SPACE],
    infoNeeded: ['Dimension des pneus (inscrite sur le flanc, ex. 205/55 R16)', 'Pneus fournis par vous ou à commander'],
    garageZones: ['pneumatiques'], durationMinutes: 60, laborPriceCents: 6000,
    priceNote: 'Montage et équilibrage de quatre roues. Pneus non inclus.',
    seoTitle: 'Montage de pneus à domicile — Vosges et Haute-Saône',
    seoDescription: 'Montage, équilibrage et changement de pneus été / hiver à domicile, autour de Remiremont, Luxeuil-les-Bains et Lure.',
  },
  {
    slug: 'suspension-direction', name: 'Suspension et direction', category: 'Châssis',
    shortDescription: 'Rotules, biellettes, silentblocs, triangles : jeu et bruits.',
    description: 'Contrôle et remplacement des éléments de suspension et de direction accessibles sans équipement d’atelier fixe : rotules, biellettes, silentblocs, triangles.',
    includes: ['Recherche de jeu et de bruits', 'Remplacement des pièces défectueuses', 'Conseil sur la géométrie à faire contrôler si nécessaire'],
    requirements: [FLAT, SPACE, 'Un contrôle de géométrie en centre spécialisé peut être recommandé après certaines interventions.'],
    infoNeeded: ['Bruits (claquements, grincements) et moment où ils apparaissent'],
    garageZones: ['suspension', 'direction'], durationMinutes: 120, laborPriceCents: null,
    priceNote: 'Devis personnalisé après vérification.',
    seoTitle: 'Réparation suspension et direction à domicile — Vosges',
    seoDescription: 'Rotules, biellettes, silentblocs : contrôle et réparation de la suspension et de la direction à domicile dans les Vosges et en Haute-Saône.',
  },
  {
    slug: 'amortisseurs', name: 'Amortisseurs', category: 'Châssis',
    shortDescription: 'Remplacement des amortisseurs et coupelles.',
    description: 'Remplacement des amortisseurs avant et/ou arrière, des coupelles et butées, selon l’état constaté et les préconisations de votre véhicule.',
    includes: ['Contrôle de l’état des amortisseurs', 'Remplacement par paire', 'Remplacement des coupelles si nécessaire'],
    requirements: [FLAT, SPACE],
    infoNeeded: ['Avant, arrière ou les deux si vous le savez'],
    garageZones: ['suspension'], durationMinutes: 150, laborPriceCents: null,
    priceNote: 'Devis personnalisé après vérification.',
    seoTitle: 'Changement d’amortisseurs à domicile — Remiremont, Lure',
    seoDescription: 'Remplacement des amortisseurs avant et arrière à domicile dans les Vosges et en Haute-Saône. Demande de devis en ligne.',
  },
  {
    slug: 'batterie-demarrage', name: 'Batterie et démarrage', category: 'Électricité',
    shortDescription: 'Voiture qui ne démarre plus : test et remplacement de batterie.',
    description: 'Test de la batterie et du circuit de charge, remplacement de la batterie si nécessaire, initialisation lorsque le véhicule le demande.',
    includes: ['Test de la batterie', 'Contrôle de la charge', 'Remplacement et reprise de l’ancienne batterie', 'Initialisation si nécessaire'],
    requirements: ['Un accès à l’avant du véhicule (ou à l’emplacement de la batterie).'],
    infoNeeded: ['Le véhicule démarre-t-il encore ?', 'Voyants allumés'],
    garageZones: ['batterie'], durationMinutes: 45, laborPriceCents: 3500,
    priceNote: 'Main-d’œuvre. Batterie selon véhicule, chiffrée au devis.',
    seoTitle: 'Remplacement de batterie auto à domicile — Vosges',
    seoDescription: 'Voiture qui ne démarre plus ? Test et remplacement de batterie à domicile autour de Rupt-sur-Moselle, Le Thillot et Remiremont.',
  },
  {
    slug: 'alternateur-demarreur', name: 'Alternateur et démarreur', category: 'Électricité',
    shortDescription: 'Défaut de charge ou de démarrage : contrôle et remplacement.',
    description: 'Contrôle du circuit de charge et de démarrage, remplacement de l’alternateur ou du démarreur lorsque l’accès le permet sur place.',
    includes: ['Mesures électriques', 'Remplacement de l’alternateur ou du démarreur', 'Contrôle de la courroie d’accessoires'],
    requirements: [FLAT, SPACE],
    infoNeeded: ['Symptômes : voyant batterie, bruit au démarrage, démarrage difficile'],
    garageZones: ['batterie', 'moteur'], durationMinutes: 150, laborPriceCents: null,
    priceNote: 'Devis personnalisé après vérification.',
    seoTitle: 'Alternateur et démarreur : réparation à domicile — Vosges, Haute-Saône',
    seoDescription: 'Contrôle et remplacement d’alternateur ou de démarreur à domicile dans les Vosges et en Haute-Saône.',
  },
  {
    slug: 'distribution', name: 'Distribution', category: 'Moteur',
    shortDescription: 'Kit de distribution et pompe à eau selon préconisations.',
    description: 'Remplacement du kit de distribution (courroie, galets) et de la pompe à eau lorsque préconisé, sur les véhicules pour lesquels l’intervention est réalisable sur place.',
    includes: ['Vérification de la faisabilité sur place', 'Remplacement du kit et de la pompe à eau si préconisé', 'Calage et contrôle de fonctionnement'],
    requirements: [FLAT, SPACE, 'Intervention longue : prévoir la demi-journée ou la journée.'],
    infoNeeded: ['Kilométrage', 'Date du dernier remplacement si connue', 'Numéro VIN (sur la carte grise, case E) pour identifier la motorisation exacte'],
    garageZones: ['moteur', 'refroidissement'], durationMinutes: 300, laborPriceCents: null,
    priceNote: 'Devis personnalisé après vérification.',
    seoTitle: 'Kit de distribution à domicile — Vosges et Haute-Saône',
    seoDescription: 'Remplacement du kit de distribution et de la pompe à eau à domicile, après étude de faisabilité, dans les Vosges et en Haute-Saône.',
  },
  {
    slug: 'reparations-mecaniques', name: 'Réparations mécaniques', category: 'Mécanique',
    shortDescription: 'Autres réparations compatibles avec une intervention mobile.',
    description: 'Échappement, refroidissement, capteurs, éclairage et autres réparations réalisables sur place. Décrivez votre besoin : nous vous indiquons honnêtement si l’intervention est possible à domicile.',
    includes: ['Étude de votre demande', 'Devis avant intervention', 'Orientation vers un atelier fixe si nécessaire'],
    requirements: [FLAT, SPACE],
    infoNeeded: ['Description du problème', 'Photos si possible'],
    garageZones: ['transmission', 'refroidissement', 'moteur'], durationMinutes: 120, laborPriceCents: null,
    priceNote: 'Devis personnalisé après vérification.',
    seoTitle: 'Réparation automobile à domicile — Vosges et Haute-Saône',
    seoDescription: 'Réparations mécaniques compatibles avec une intervention mobile, à domicile autour de Remiremont, Le Thillot, Luxeuil-les-Bains et Lure.',
  },
];

export interface CommuneSeed { name: string; postcode: string; department: '88' | '70'; lat: number; lon: number; featured?: boolean }

/** Coordonnées approximatives (centre de la commune), suffisantes pour estimer une distance. */
export const COMMUNE_SEEDS: CommuneSeed[] = [
  { name: 'Rupt-sur-Moselle', postcode: '88360', department: '88', lat: 47.9264, lon: 6.6631, featured: true },
  { name: 'Remiremont', postcode: '88200', department: '88', lat: 48.0172, lon: 6.5911, featured: true },
  { name: 'Le Thillot', postcode: '88160', department: '88', lat: 47.8797, lon: 6.7633, featured: true },
  { name: "Le Val-d'Ajol", postcode: '88340', department: '88', lat: 47.925, lon: 6.4806, featured: true },
  { name: 'Plombières-les-Bains', postcode: '88370', department: '88', lat: 47.9636, lon: 6.4572, featured: true },
  { name: 'Luxeuil-les-Bains', postcode: '70300', department: '70', lat: 47.8172, lon: 6.3814, featured: true },
  { name: 'Lure', postcode: '70200', department: '70', lat: 47.6836, lon: 6.4967, featured: true },
  { name: 'Ferdrupt', postcode: '88360', department: '88', lat: 47.9033, lon: 6.6939 },
  { name: 'Ramonchamp', postcode: '88160', department: '88', lat: 47.8944, lon: 6.7417 },
  { name: 'Fresse-sur-Moselle', postcode: '88160', department: '88', lat: 47.8761, lon: 6.7869 },
  { name: 'Saint-Maurice-sur-Moselle', postcode: '88560', department: '88', lat: 47.8578, lon: 6.8231 },
  { name: 'Bussang', postcode: '88540', department: '88', lat: 47.8856, lon: 6.8536 },
  { name: 'Vecoux', postcode: '88200', department: '88', lat: 47.977, lon: 6.64 },
  { name: 'Dommartin-lès-Remiremont', postcode: '88200', department: '88', lat: 47.9994, lon: 6.6411 },
  { name: 'Saint-Étienne-lès-Remiremont', postcode: '88200', department: '88', lat: 48.0244, lon: 6.6083 },
  { name: 'Saint-Nabord', postcode: '88200', department: '88', lat: 48.0522, lon: 6.5822 },
  { name: 'Saint-Amé', postcode: '88120', department: '88', lat: 48.0236, lon: 6.6633 },
  { name: 'Vagney', postcode: '88120', department: '88', lat: 48.0061, lon: 6.7172 },
  { name: 'Saulxures-sur-Moselotte', postcode: '88290', department: '88', lat: 47.9481, lon: 6.7703 },
  { name: 'Cornimont', postcode: '88310', department: '88', lat: 47.9597, lon: 6.8364 },
  { name: 'La Bresse', postcode: '88250', department: '88', lat: 48.0061, lon: 6.8778 },
  { name: 'Éloyes', postcode: '88510', department: '88', lat: 48.0975, lon: 6.6097 },
  { name: 'Xertigny', postcode: '88220', department: '88', lat: 48.0444, lon: 6.4053 },
  { name: 'Faucogney-et-la-Mer', postcode: '70310', department: '70', lat: 47.8417, lon: 6.5617 },
  { name: 'Fougerolles-Saint-Valbert', postcode: '70220', department: '70', lat: 47.8858, lon: 6.4058 },
  { name: 'Saint-Loup-sur-Semouse', postcode: '70800', department: '70', lat: 47.8839, lon: 6.2739 },
  { name: 'Corbenay', postcode: '70320', department: '70', lat: 47.8925, lon: 6.3333 },
  { name: 'Mélisey', postcode: '70270', department: '70', lat: 47.7536, lon: 6.5803 },
  { name: 'Servance-Miellin', postcode: '70440', department: '70', lat: 47.8217, lon: 6.6928 },
  { name: 'Ronchamp', postcode: '70250', department: '70', lat: 47.7008, lon: 6.6361 },
  { name: 'Champagney', postcode: '70290', department: '70', lat: 47.7053, lon: 6.6825 },
];

export const FAQ_SEEDS: { question: string; answer: string }[] = [
  { question: 'Comment se passe une intervention à domicile ?', answer: 'Vous faites une demande en ligne ou par téléphone. Nous vous rappelons pour confirmer le besoin, le créneau et le montant. Le jour venu, l’intervention a lieu devant chez vous, sur votre lieu de travail ou à l’endroit convenu.' },
  { question: 'Le rendez-vous est-il confirmé dès ma demande ?', answer: 'Non. Votre demande est enregistrée immédiatement avec une référence, puis nous vous contactons pour confirmer la date et l’heure. Rien n’est réalisé sans votre accord.' },
  { question: 'De quel espace avez-vous besoin ?', answer: 'Pour la plupart des interventions : un sol plat et stable (cour, allée, parking) et environ un mètre d’espace autour du véhicule. Les exigences propres à chaque prestation sont indiquées lors de la demande.' },
  { question: 'Et s’il pleut ?', answer: 'Beaucoup d’interventions restent possibles avec un abri (garage, carport, parking couvert). Si les conditions ne permettent pas de travailler correctement, nous convenons ensemble d’un autre créneau.' },
  { question: 'Les prix affichés sont-ils définitifs ?', answer: 'Les montants affichés en ligne sont des estimations indicatives. Le prix définitif figure sur le devis, que vous acceptez avant le début des travaux.' },
  { question: 'Quelles réparations ne sont pas possibles à domicile ?', answer: 'Les travaux qui exigent un pont élévateur, une machine spécifique ou un environnement d’atelier fixe. Dans ce cas, nous vous le disons clairement avant tout déplacement.' },
  { question: 'Je ne sais pas ce qu’a ma voiture. Que faire ?', answer: 'Choisissez « Je ne sais pas quelle est la panne » lors de la demande et décrivez ce que vous constatez. Nous commençons par un diagnostic.' },
  { question: 'Dois-je créer un compte ?', answer: 'Non. Un nom, un numéro de téléphone et l’adresse de l’intervention suffisent.' },
];
