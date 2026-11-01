# Valfran Mécanique — site officiel

Mécanique automobile à domicile & vente de véhicules d'occasion (Haute-Saône / Vosges).

**Stack :** React 18 · Vite · Tailwind CSS · Framer Motion · Lucide · React Router (routes chargées à la demande).

## Démarrage
```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production -> dist/
npm run preview
```

## Structure
```
src/
  components/   Header, Footer, ZoneMap (carte SVG interactive), CarVisual, Accordion, Sections…
  garage/       Garage Virtuel : GarageVirtuel + Step1..5 (Plaque, Véhicule, Intervention, Estimation, RDV), Confirmation
  store/        garageStore.jsx — useReducer + Context, devis dérivé (useMemo)
  lib/          pricing.js (simulateur), vehicleLookup.js (API plaque simulée), slots.js, api.js (envoi formulaires)
  data/         business.js, services.js, zones.js, vehicles.js, content.js
  pages/        Home, Mecanique, GaragePage, Vehicules, VehicleDetail, About, Contact, Legal, NotFound
```

## À personnaliser avant mise en ligne
- `src/data/business.js` : téléphone, e-mail, SIRET, adresse, horaires, tarif horaire.
- `src/data/vehicles.js` : votre stock réel (ajouter des photos).
- `src/data/content.js` : vrais avis clients, FAQ.
- `src/lib/vehicleLookup.js` : remplacer la simulation par un appel à votre backend/API d'immatriculation.
- `src/lib/api.js` : brancher l'envoi des RDV/contacts (aujourd'hui stockés en localStorage uniquement).
- `src/lib/slots.js` : brancher un vrai agenda.
- Mentions légales / confidentialité : compléter et faire valider ; domaine dans `public/sitemap.xml` et `robots.txt`.

## SEO / performance
Meta et JSON-LD (`AutoRepair`) dans `index.html`, titre/description par page, code splitting, JS d'entrée ≈ 25 ko gzip.
SPA : pour un SEO maximal, prévoir du pré-rendu (ex. Next.js) et un serveur avec fallback vers `index.html`.
