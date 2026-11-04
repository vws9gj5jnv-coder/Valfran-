# Architecture

## Vue d'ensemble

Application Next.js 16 (App Router) unique, rendue côté serveur, qui sert à la fois le site public,
l'API et l'administration. Aucune infrastructure 3D côté serveur : les scènes sont calculées sur l'appareil
du visiteur, uniquement s'il en est capable.

```
src/
  app/
    (site)/                Site public (accueil, services, zones, garage virtuel, rendez-vous, devis client, pages légales)
    admin/                 Administration (connexion + espace protégé (app)/)
    api/                   Routes serveur : plaque, adresse, créneaux, demandes, photos, contact, fichiers, PDF, agenda
    sitemap.ts, robots.ts  SEO
  proxy.ts                 CSP avec nonce par requête, redirection rapide de /admin sans cookie
  db/                      Schéma Drizzle (PostgreSQL), connexion (PostgreSQL ou PGlite), données de base et démo
  modules/                 Logique métier indépendante de l'interface
    plates/                Validation SIV/FNI, fournisseurs (démo, HTTP générique), limitation de fréquence
    vehicles/              Référentiel marques/modèles, catégories d'illustration 3D
    zones/                 Distances, paliers de frais, exceptions communales, géocodage (local / BAN)
    availability/          Créneaux matin / après-midi, fuseau Europe/Paris, congés, rendez-vous confirmés
    pricing/               Estimation (n'affiche que des prix validés)
    bookings/              Schéma de saisie, création transactionnelle, statuts et transitions
    quotes/                Totaux, numérotation, PDF, acceptation en ligne traçable
    notifications/         Adaptateurs e-mail / SMS + journal d'envoi (simulé ≠ envoyé)
    storage/               Stockage des photos (disque privé / Supabase), contrôle de signature
    auth/                  Hachage scrypt, sessions en base, verrouillage, audit
    security/              Limitation de fréquence en base, empreintes non réversibles
    calendar/              Flux iCalendar
    settings/              Paramètres administrables (zod), cache 30 s
    admin/                 Actions serveur de l'administration
    analytics/             Mesure d'audience sans cookie (optionnelle)
  components/
    booking/               Assistant de réservation (5 étapes, brouillon local, reprise après coupure)
    three/engine/          Moteur 4 cylindres procédural (hero)
    three/car/             Véhicule prototype + studio + zones interactives (garage virtuel)
    admin/, layout/, ui/, home/
```

## Base de données

PostgreSQL via Drizzle ORM. Migrations SQL versionnées dans `drizzle/`, appliquées automatiquement au premier
accès. Sans `DATABASE_URL`, l'application utilise **PGlite** (PostgreSQL compilé en WebAssembly, fichier local) :
même moteur, mêmes requêtes, idéal pour la démonstration et les tests. En production : PostgreSQL managé.

Tables principales : `settings`, `services`, `communes`, `closures`, `customers`, `vehicles`, `bookings`,
`booking_events`, `attachments`, `quotes`, `quote_lines`, `quote_events`, `faqs`, `realisations`, `testimonials`,
`messages`, `notifications`, `admin_users`, `sessions`, `rate_limits`, `audit_log`, `counters`.
Montants en centimes (entiers). Les lignes de démonstration portent `is_demo = true`.

## Parcours de réservation

1. Véhicule : plaque (appel serveur, limité à 10/h/visiteur et 300/jour) ou choix manuel.
2. Intervention(s) ou « Je ne sais pas » (→ diagnostic), photos facultatives.
3. Adresse : vérification de zone côté serveur (les coordonnées envoyées par le navigateur ne sont jamais utilisées).
4. Créneaux souhaités (demi-journées), toujours « à confirmer ».
5. Coordonnées + récapitulatif + estimation. Envoi idempotent (double clic / coupure réseau sans doublon).

La demande est enregistrée dans une transaction (client rapproché par téléphone, véhicule, demande, historique,
photos), reçoit une référence `VF-AAMM-XXXX`, puis les notifications sont envoyées ou simulées et journalisées.

## Sécurité

- Validation zod côté serveur de toutes les entrées ; requêtes paramétrées (Drizzle) ; aucune concaténation SQL.
- Administration : mot de passe scrypt (N=2¹⁷), session aléatoire 256 bits stockée hachée, cookie `__Host-`,
  `HttpOnly`, `Secure`, `SameSite=Lax`, 12 h ; verrouillage après 8 échecs ; limitation par IP ; journal d'audit.
  Chaque page, action serveur et route d'administration revérifie la session (`requireAdmin`).
- CSRF : actions serveur protégées par Next.js (contrôle d'origine) ; routes POST publiques vérifiant `Origin`.
- CSP stricte avec nonce, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Photos : type déterminé par signature binaire, 8 Mo max, nom aléatoire, stockage hors dossier public,
  servies avec `Content-Security-Policy: default-src 'none'`.
- Champ piège anti-robots et limitation de fréquence sur demandes, contact, photos, devis.
- Données personnelles absentes des journaux : plaques et IP réduites à une empreinte salée.

## 3D

- **Hero** : moteur 4 cylindres en ligne DOHC 16 soupapes généré par code (`three/engine`). Cinématique
  bielle-manivelle exacte, vilebrequin plat, ordre d'allumage 1-3-4-2, distribution 2:1, levée des soupapes
  calculée depuis le profil des cames. Une image statique (rendu réel de la scène) s'affiche d'abord ; la scène
  n'est chargée qu'après un temps mort du navigateur, si l'appareil est jugé capable (WebGL2, mémoire, cœurs,
  pas d'économiseur de données, pas de « réduire les animations »). Bouton pause (WCAG 2.2.2), arrêt
  automatique après 26 s, pause hors écran.
- **Garage virtuel** : véhicule prototype procédural (voir [3D.md](3D.md)), studio éclairé par environnement
  procédural (aucune HDRI sous licence requise), ombres de contact, caméra limitée et cadrages par zone, mode
  « radiographie » qui révèle l'organe concerné. Version sans 3D entièrement fonctionnelle.
