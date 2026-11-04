# Déploiement

> Rien n'a été déployé publiquement. Cette procédure est à exécuter après votre accord.

## Option A — recommandée pour démarrer : Vercel + Supabase

1. **Supabase** (région UE, ex. Francfort) : créer un projet → copier la chaîne de connexion « Transaction pooler »
   dans `DATABASE_URL` (`?sslmode=require`). Créer un bucket **privé** `valfran-private` et renseigner
   `STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
2. **Vercel** : importer le dépôt GitHub (framework détecté : Next.js). Renseigner les variables
   (voir CONFIGURATION.md). Pour un usage commercial, l'offre Pro est requise.
3. Premier déploiement : les migrations s'appliquent au premier accès. Puis, en local avec `DATABASE_URL` de
   production : `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:create`.
4. Domaine : l'ajouter dans Vercel, mettre à jour `SITE_URL`, puis déclarer `https://domaine/sitemap.xml`
   dans Google Search Console et relier la fiche Google Business Profile (lien dans l'administration).

## Option B — économique : un serveur (VPS) en France

Node 22 + PostgreSQL 16 sur le même serveur (Scaleway, OVHcloud…), derrière Caddy ou Nginx (HTTPS automatique).

```bash
git clone … && cd valfran && npm ci && npm run build
cp .env.example .env.local   # puis compléter : DATABASE_URL=postgres://valfran:…@localhost/valfran
npm run db:migrate && ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:create
npm start                    # à lancer via systemd ou pm2, port 3000
```

Le stockage local des photos (`UPLOAD_DIR`) convient ici ; l'inclure dans les sauvegardes.

## Sauvegardes

- Base : sauvegarde quotidienne (incluse chez Supabase Pro ; sur VPS :
  `pg_dump -Fc valfran > /sauvegardes/valfran-$(date +%F).dump`, conservation 30 jours, copie hors serveur).
- Photos : synchronisation quotidienne du dossier `UPLOAD_DIR` ou du bucket.
- Tester une restauration au moins une fois par trimestre (`pg_restore -d valfran_test …`).

## Tâches planifiées conseillées

- Politique de conservation : bouton dans Paramètres, ou appel mensuel (à automatiser via une tâche planifiée
  si souhaité).

## Vérifications avant ouverture

- [ ] `DEMO_MODE=false`, `HASH_SALT`, `SITE_URL` définis ; compte démo absent.
- [ ] Mentions légales complètes (plus aucun « [À compléter] »), CGV relues.
- [ ] Tarifs validés ; téléphone réel (le numéro par défaut est fictif, plage ARCEP réservée).
- [ ] Envoi d'e-mail réel testé (demande de test → réception).
- [ ] Sauvegarde et restauration testées.
- [ ] `npm run test:e2e` vert sur l'environnement de préproduction.
- [ ] Mesure Core Web Vitals sur mobile réel (PageSpeed Insights) après mise en ligne.
