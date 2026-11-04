# Coûts d'exploitation (estimation)

Estimations établies en novembre 2026 sur la base des grilles publiques habituelles des prestataires ;
**à confirmer** au moment de la souscription (tarifs, taux de change, TVA). Trafic visé : faible
(quelques milliers de visites et quelques dizaines de demandes par mois).

## Coûts fixes mensuels

| Poste | Option A (Vercel + Supabase) | Option B (VPS) |
|---|---|---|
| Hébergement de l'application | Vercel Pro ≈ 20 $ ≈ 18–19 € HT | VPS 2 vCPU / 4 Go ≈ 8–15 € HT |
| Base de données + sauvegardes | Supabase Pro ≈ 25 $ ≈ 23 € HT | incluse (même serveur) + stockage de sauvegarde ≈ 1–3 € |
| Nom de domaine `.fr` | ≈ 1 € HT | ≈ 1 € HT |
| E-mails transactionnels | 0 € (offres gratuites Brevo / Resend suffisantes) | 0 € |
| Mesure d'audience (facultatif) | Plausible ≈ 9 € | idem ou auto-hébergé |
| **Total fixe** | **≈ 42–52 € HT** | **≈ 10–28 € HT** |

## Coûts variables

| Poste | Hypothèse | Ordre de grandeur |
|---|---|---|
| Identification par plaque | tarif fournisseur par requête (souvent 0,05 à 0,30 € selon volume et contrat) | 100 recherches ≈ 5–30 € |
| SMS (France) | ≈ 0,05–0,08 € HT par SMS | 100 SMS ≈ 5–8 € |
| Cartographie / distances | BAN gratuite ; calcul d'itinéraire non utilisé | 0 € |
| Rendu 3D | sur l'appareil du visiteur | 0 € |

Les plafonds `PLATE_LOOKUPS_PER_HOUR` et `PLATE_LOOKUPS_PER_DAY` limitent le coût maximal des recherches de plaque.

## Synthèse

Budget initial réaliste : **≈ 50 à 90 € HT / mois** (option A avec plaques et SMS), ou **≈ 20 à 60 € HT**
(option B). Le budget cible d'environ 100 € HT / mois est respecté dans les deux cas.

Coûts ponctuels non inclus : production des modèles 3D photoréalistes (voir 3D.md), photographies des
interventions, relecture juridique des CGV, éventuel logiciel de facturation conforme à la facturation
électronique.
