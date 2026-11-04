# VALFRAN — plateforme de mécanique automobile à domicile

Site public, prise de rendez-vous, administration, devis et garage virtuel 3D pour VALFRAN
(Vosges · Haute-Saône). Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL (Drizzle ORM) ·
Three.js / React Three Fiber · Playwright · Vitest.

> **Mode démonstration actif par défaut.** Tarifs, identification de plaque, e-mails et SMS sont simulés et
> signalés comme tels. Voir [docs/ETAT-DES-FONCTIONNALITES.md](docs/ETAT-DES-FONCTIONNALITES.md).

## Démarrer en local

```bash
npm install
npm run dev            # http://localhost:3000 — base PGlite locale créée automatiquement (.data/)
```

- Administration : http://localhost:3000/admin — en développement, compte démo pré-rempli
  (`demo@valfran.example` / `demo-valfran-2026`).
- Plaques d'essai (mode démo) : `AB-123-CD`, `EF-456-GH` (plusieurs versions), `JK-789-LM`, `NP-321-QR`,
  `ZZ-999-ZZ` (introuvable), `XX-500-XX` (fournisseur indisponible), `XX-429-XX` (quota dépassé).
- Forcer / couper la 3D : ajouter `?3d=on` ou `?3d=off` à l'URL.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run typecheck` · `npm run lint` | Vérifications statiques |
| `npm test` | Tests unitaires des règles métier (Vitest) |
| `npm run test:e2e` | Parcours complets dans Chromium (Playwright, sur le build de production) |
| `npm run db:migrate` | Applique les migrations (aussi fait automatiquement au démarrage) |
| `npm run db:generate` | Génère une migration après modification de `src/db/schema.ts` |
| `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:create` | Crée / réinitialise un compte administrateur |
| `node scripts/capture-posters.cjs --garage` | Régénère les images statiques des scènes 3D |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — modules, base de données, sécurité, 3D
- [Configuration](docs/CONFIGURATION.md) — variables d'environnement et services externes
- [Déploiement](docs/DEPLOIEMENT.md) — procédure, sauvegardes, mise en production
- [Coûts d'exploitation](docs/COUTS.md)
- [État des fonctionnalités](docs/ETAT-DES-FONCTIONNALITES.md) — opérationnel / simulé / à réaliser
- [RGPD](docs/RGPD.md) — registre des traitements (projet)
- [Modèles 3D](docs/3D.md) — état du prototype et pipeline de production des véhicules

L'ancienne version du site (Vite) est archivée dans [`legacy/`](legacy/README.md).
