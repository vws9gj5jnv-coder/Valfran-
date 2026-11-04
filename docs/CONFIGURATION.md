# Configuration et services externes

Toutes les variables sont listées dans [`.env.example`](../.env.example). Elles se définissent dans `.env.local`
(local) ou dans l'interface de l'hébergeur. **Aucune clé n'est exposée au navigateur.**

## Passer du mode démonstration à la production

1. `DEMO_MODE=false` — supprime le bandeau, les données fictives ne sont plus créées sur une base neuve, les
   tarifs ne sont plus marqués « démo » (ils restent masqués tant que vous ne les avez pas validés).
2. `DATABASE_URL` vers un PostgreSQL managé (base neuve : les données de démonstration n'y seront pas créées).
3. `SITE_URL` = votre domaine (canonical, sitemap, liens des devis).
4. `HASH_SALT` = valeur aléatoire (`openssl rand -hex 32`).
5. Créer le compte administrateur : `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:create` (12 caractères min.).
6. Dans l'administration : coordonnées, mentions légales, tarifs (cocher « prix validé »), zone, horaires, FAQ.
7. Activer les services ci-dessous selon vos besoins.

## Services (adaptateurs indépendants)

| Service | Variable | Valeurs | État |
|---|---|---|---|
| Identification par plaque | `PLATE_PROVIDER` | `demo` · `http` · `none` | `http` : gabarit générique (`PLATE_API_URL` avec `{plate}`, `PLATE_API_KEY` en Bearer) **à adapter au contrat du fournisseur choisi, non testé**. Vérifier les conditions légales d'accès aux données SIV (fournisseurs agréés uniquement). |
| E-mails | `EMAIL_PROVIDER` | `demo` · `resend` · `brevo` · `none` | Adaptateurs Resend et Brevo écrits selon leur API publique, **non testés avec un compte réel**. Domaine d'envoi à authentifier (SPF, DKIM, DMARC). |
| SMS | `SMS_PROVIDER` | `demo` · `brevo` · `none` | Brevo SMS transactionnel, **non testé**. Activer aussi « SMS » dans Paramètres. |
| Adresses | `GEOCODER_PROVIDER` | `local` · `ban` | `ban` = Base Adresse Nationale (gratuite, sans clé) avec repli local. Distances : vol d'oiseau × coefficient routier (réglable). |
| Photos | `STORAGE_PROVIDER` | `local` · `supabase` | `local` : disque privé (serveur unique). `supabase` : bucket privé, **non testé**. Obligatoire en hébergement serverless. |
| Agenda | `CALENDAR_FEED_TOKEN` | jeton ≥ 24 car. | Flux iCalendar en lecture (Google Agenda, Apple, Outlook) des rendez-vous confirmés. Pas de synchronisation bidirectionnelle. |
| Audience | `ANALYTICS_PROVIDER` | `none` · `plausible` | Sans cookie, aucune donnée de formulaire transmise. |
| Paiement | `PAYMENT_PROVIDER` | `none` | Non implémenté. Le site n'encaisse rien. |
| Catalogue pièces | — | — | Non connecté : nécessite un contrat de licence (TecDoc, etc.). Les références sont saisies à la main dans les devis. |

## Réglages administrables (sans code)

Prestations (activation, textes, prix, durée, zones 3D, SEO) · zone (point de départ, rayon, coefficient,
paliers, exceptions par commune, pages locales) · horaires, délai minimal, congés · coordonnées et mentions
légales · textes du site · FAQ · réalisations et photos · avis authentiques · tarification générale et TVA ·
notifications · durées de conservation.
