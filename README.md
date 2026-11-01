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

## SEO / pré-rendu
`npm run build` fait trois choses : build client, build SSR (`src/entry-server.jsx`), puis `scripts/prerender.mjs`
qui écrit un HTML complet par page dans `dist/` (accueil, pages, **une page par véhicule**, `404.html`).
Le navigateur hydrate ensuite la page (`hydrateRoot`) : l'expérience reste celle d'une app React.

- Chaque page a son `<title>`, sa description, son `canonical` et ses balises Open Graph (fournis par `useMeta`).
- `sitemap.xml` et `robots.txt` sont générés à chaque build. Définissez votre domaine :
  `SITE_URL=https://votre-domaine.fr npm run build`
- Nouvelle page ou nouveau véhicule : ajoutez la route dans `src/App.jsx` ; les véhicules de `data/vehicles.js` et la liste
  `routes` de `entry-server.jsx` sont pré-rendus automatiquement (pages fixes à y ajouter à la main).
- Hébergement : n'importe quel hébergeur statique (Netlify, Vercel, Cloudflare Pages, GitHub Pages, OVH…) qui sert
  `dossier/index.html` et `404.html`. Aucun serveur Node requis.
- Règle à respecter dans les composants : pas de valeur dépendant de `Date`/`Math.random`/`window` au premier rendu
  (sinon erreur d'hydratation) ; arrondir les calculs flottants affichés dans le SVG.
- `npm run dev` reste un rendu 100 % client (sans pré-rendu).
