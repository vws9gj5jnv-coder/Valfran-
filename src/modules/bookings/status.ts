export const BOOKING_STATUSES = {
  nouvelle: 'Nouvelle demande',
  a_etudier: 'À étudier',
  devis_necessaire: 'Devis nécessaire',
  confirmee: 'Confirmée',
  terminee: 'Terminée',
  annulee: 'Annulée',
} as const;
export type BookingStatus = keyof typeof BOOKING_STATUSES;

const T: Record<BookingStatus, BookingStatus[]> = {
  nouvelle: ['a_etudier', 'devis_necessaire', 'confirmee', 'annulee'],
  a_etudier: ['devis_necessaire', 'confirmee', 'annulee'],
  devis_necessaire: ['a_etudier', 'confirmee', 'annulee'],
  confirmee: ['terminee', 'annulee', 'a_etudier'],
  terminee: [],
  annulee: ['a_etudier'],
};

export const canTransition = (from: BookingStatus, to: BookingStatus) => T[from]?.includes(to) ?? false;
export const isBookingStatus = (s: string): s is BookingStatus => s in BOOKING_STATUSES;
