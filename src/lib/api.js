// Couche d'envoi des formulaires. Aucune donnée n'est envoyée en l'état :
// remplacez `post` par un vrai fetch() vers votre backend / service (Formspree, Resend, API maison…).
const post = (type, payload) =>
  new Promise((resolve) => {
    setTimeout(() => {
      try {
        const key = 'valfran:submissions';
        const all = JSON.parse(localStorage.getItem(key) || '[]');
        all.push({ type, payload, at: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(all.slice(-50)));
      } catch { /* stockage indisponible */ }
      resolve({ ok: true, ref: 'VF-' + Math.random().toString(36).slice(2, 8).toUpperCase() });
    }, 900);
  });

export const submitBooking = (payload) => post('booking', payload);
export const submitContact = (payload) => post('contact', payload);
export const submitVehicleRequest = (payload) => post('vehicle-request', payload);
