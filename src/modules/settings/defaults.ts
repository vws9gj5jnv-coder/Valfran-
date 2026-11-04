import type { Settings } from './schema';

/**
 * Valeurs initiales. Les coordonnées et mentions légales réelles sont à saisir dans l'administration :
 * aucune donnée d'entreprise n'est inventée. Le numéro de téléphone par défaut appartient à la plage
 * réservée par l'ARCEP aux œuvres de fiction (03 53 01 xx xx) et n'attribue donc rien à personne.
 */
export function defaultSettings(demo: boolean): Settings {
  return {
    business: {
      name: 'VALFRAN',
      tagline: "L'atelier vient à vous.",
      phone: '03 53 01 00 00',
      email: demo ? 'contact@valfran.example' : '',
      addressLine: '',
      postcode: '88360',
      city: 'Rupt-sur-Moselle',
      legalName: '',
      legalForm: '',
      siret: '',
      registration: '',
      vatNumber: '',
      publicationDirector: '',
      hostName: '',
      hostAddress: '',
      insurance: '',
      mediator: '',
      googleBusinessUrl: '',
      hours: [
        { label: 'Lundi – vendredi', value: '8 h – 18 h' },
        { label: 'Samedi', value: '8 h – 12 h' },
        { label: 'Dimanche', value: 'Fermé' },
      ],
      qualifications: [],
      phoneIsPlaceholder: true,
    },
    content: {
      heroTitle: "L'atelier vient à vous.",
      heroSubtitle: 'Entretien, diagnostic et réparation automobile à domicile dans les Vosges et en Haute-Saône.',
      aboutTitle: 'Une mécanique de précision, au pied de chez vous.',
      aboutText:
        "VALFRAN est une entreprise indépendante de mécanique automobile à domicile. L'atelier se déplace chez vous, sur votre lieu de travail ou à l'endroit qui vous convient, avec l'outillage nécessaire aux interventions compatibles avec un travail mobile.\n\nChaque demande est étudiée avant intervention : vous savez ce qui sera fait, pourquoi, et pour quel montant. Lorsqu'une réparation demande un équipement d'atelier fixe, nous vous le disons clairement.",
      bookingIntro: 'Quelques questions simples. Comptez environ deux minutes.',
      realisationsIntro: 'Des interventions réelles, photographiées sur place avec l’accord des clients.',
    },
    pricing: {
      hourlyRateCents: 5500,
      vatMode: 'franchise',
      vatRate: 20,
      demoPrices: demo,
      quoteValidityDays: 30,
      estimateDisclaimer:
        'Estimation indicative de main-d’œuvre et de déplacement. Les pièces dépendent de votre véhicule et sont chiffrées sur le devis, validé par vous avant toute intervention.',
    },
    zone: {
      baseName: 'Rupt-sur-Moselle',
      baseLat: 47.9264,
      baseLon: 6.6631,
      roadFactor: 1.3,
      maxKm: 50,
      tiers: [
        { upToKm: 15, feeCents: 0 },
        { upToKm: 30, feeCents: 1500 },
        { upToKm: 50, feeCents: 2500 },
      ],
      outsidePolicy: 'on_request',
    },
    availability: {
      weekly: {
        '1': [{ start: '08:00', end: '12:00' }, { start: '13:30', end: '18:00' }],
        '2': [{ start: '08:00', end: '12:00' }, { start: '13:30', end: '18:00' }],
        '3': [{ start: '08:00', end: '12:00' }, { start: '13:30', end: '18:00' }],
        '4': [{ start: '08:00', end: '12:00' }, { start: '13:30', end: '18:00' }],
        '5': [{ start: '08:00', end: '12:00' }, { start: '13:30', end: '18:00' }],
        '6': [{ start: '08:00', end: '12:00' }],
        '7': [],
      },
      minNoticeHours: 24,
      daysAhead: 21,
      timezone: 'Europe/Paris',
    },
    notifications: { notifyAdminByEmail: true, customerEmail: true, customerSms: false },
    retention: { prospectMonths: 36, customerMonths: 60 },
  };
}
