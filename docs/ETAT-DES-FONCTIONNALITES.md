# État des fonctionnalités

Légende : ✅ opérationnel et testé · 🟡 simulé / démonstration (clairement signalé) · ⬜ non réalisé (à produire ou à brancher)

## Site public
- ✅ Accueil (moteur 3D animé + image statique de repli), services, 10 pages de prestations, comment ça marche,
  zones (carte, recherche de commune, 7 pages locales), réalisations, à propos, tarifs, contact, FAQ, pages légales, 404.
- ✅ Mobile-first, barre d'appel / rendez-vous permanente, aucun défilement horizontal (test automatisé).
- ✅ SEO : titres et descriptions uniques, canonical, sitemap, robots, données structurées (AutoRepair, Service, FAQPage, BreadcrumbList).
- 🟡 Coordonnées (téléphone fictif ARCEP), textes et tarifs de démonstration — à remplacer dans l'administration.
- ⬜ Logo officiel (logotype typographique provisoire), photographies réelles, avis authentiques (section masquée tant qu'aucun n'est publié).

## Réservation
- ✅ Identification manuelle, gestion des cas : plaque invalide, introuvable, plusieurs versions, fournisseur indisponible, quota, erreur réseau.
- 🟡 Identification par plaque : fournisseur de démonstration. ⬜ Fournisseur réel (gabarit HTTP prêt, contrat à souscrire).
- ✅ Prestations, « Je ne sais pas » → diagnostic, photos (contrôle de format), exigences sur place.
- ✅ Vérification de zone et frais de déplacement (règles administrables). Distances estimées (pas d'itinéraire routier réel).
- ✅ Créneaux calculés (horaires, congés, rendez-vous confirmés, délai minimal) ; statut « à confirmer ».
- ✅ Enregistrement réel, référence unique, page de confirmation, anti-doublon, reprise après coupure.
- 🟡 Accusés de réception e-mail / SMS : simulés et journalisés « simulé ». ⬜ Envoi réel (clé API à fournir).

## Administration
- ✅ Connexion sécurisée, tableau de bord, demandes (filtres, recherche, statuts, planification, annulation, notes, photos, historique), planning hebdomadaire, clients (fiche, véhicules, historique, export RGPD, anonymisation).
- ✅ Devis : création depuis une demande ou un client, lignes pièces / main-d'œuvre / déplacement / autre, TVA ou franchise, PDF, lien client, acceptation ou refus en ligne traçable, historique, duplication.
- ✅ Prestations et tarifs, zones et communes, horaires et congés, textes, FAQ, réalisations (photos), avis (authenticité exigée), messages, journal des envois, paramètres, politique de conservation, flux agenda iCalendar.
- ⬜ Facturation : non réalisée volontairement (devis ≠ facture). Utiliser un logiciel de facturation conforme à la réforme de la facturation électronique (réception obligatoire depuis sept. 2026, émission pour les petites entreprises à partir de sept. 2027).
- ⬜ Plusieurs comptes avec rôles distincts (un rôle « admin » unique aujourd'hui).

## 3D
- ✅ Moteur éclaté animé, cinématique réelle, image statique de repli, pause, respect de « réduire les animations ».
- 🟡 Garage virtuel : **prototype** procédural de berline compacte originale, studio, 8 zones interactives, mode radiographie, lien vers la réservation, version sans 3D. **Ce véhicule n'est pas photoréaliste.**
- ⬜ Modèles photoréalistes (Blender → GLB) des 4 catégories ; citadine, SUV et utilitaire non produits.

## Services externes
- ⬜ Paiement en ligne (aucun encaissement), catalogue de pièces sous licence, synchronisation d'agenda bidirectionnelle.

## Qualité
- ✅ 32 tests unitaires, 18 tests de bout en bout (Chromium, bureau et mobile), typage strict, lint, build de production.
- ⬜ Mesures Core Web Vitals sur appareils réels et réseau mobile (à faire après mise en ligne), audit manuel avec lecteurs d'écran (NVDA, VoiceOver), tests sur iPhone / Android physiques.
