const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 21 prochains jours (dimanche exclu), à partir de demain. */
export function getDays(count = 21) {
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) out.push(new Date(d));
  }
  return out;
}

// Créneaux d'ouverture (simulés). À remplacer par un appel agenda réel.
const WEEK = ['08:00', '09:30', '11:00', '14:00', '15:30', '17:00'];
const SAT = ['09:00', '10:30', '12:00'];

export function getSlots(date) {
  const base = date.getDay() === 6 ? SAT : WEEK;
  const seed = date.getDate() * 7 + date.getMonth() * 3;
  return base.map((t, i) => ({ time: t, available: (seed + i * 5) % 4 !== 0 }));
}
