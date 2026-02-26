# CLAUDE.md — SMASHI

## Projet

Application mobile (iOS + Android) de mise en relation de joueurs de sports de raquettes (tennis, padel, squash) et de réservation de terrains en temps réel. Fondée par Maxime GAZEL, basée à Marseille / Aix-en-Provence, région PACA. Modèle B2B2C : gratuit pour les joueurs, monétisation via les clubs et partenaires.

## Documentation

Toujours lire ces fichiers avant de coder :
- `docs/SPEC_TECHNIQUE.md` — Architecture, BDD, algorithme de matching, schema Prisma, structure du projet
- `docs/GUIDE_UX_UI.md` — Design system, parcours utilisateurs, wireframes, composants, labels français
- `docs/DONNEES_CLUBS.xlsx` — Fichier Excel avec les clubs partenaires à importer (PACA initialement)

## Stack technique

- **Framework** : React Native (Expo) avec TypeScript
- **UI** : NativeWind (Tailwind pour React Native) + composants custom design system
- **Fonts** : Inter (texte) + JetBrains Mono (chiffres/stats) via Google Fonts
- **Backend** : Node.js / Express avec TypeScript
- **ORM** : Prisma avec PostgreSQL
- **Auth** : Firebase Auth (email + Google + Apple Sign-In)
- **APIs** : Google Maps (Geocoding + Places) + API Ten'Up/FFT (classements) + API clubs (Doinsport, Gestion Sports)
- **Notifications** : Firebase Cloud Messaging (FCM)
- **Paiements** : Stripe (commissions terrains, achats in-app)
- **Stockage** : Cloudflare R2 (avatars, photos terrains)
- **Hébergement** : Microsoft Azure (Cloud) + PostgreSQL managé
- **CI/CD** : GitHub Actions + EAS Build (Expo)

## Identité visuelle SMASHI

### Logo
Le logo SMASHI est dans `assets/logo-smashi.png`. L'utiliser sur l'écran de splash, la barre de navigation et la page de login.

### Palette de couleurs (basée sur le vert dynamique SMASHI #2ECC71)

**Couleurs principales :**
- `primary` : **#2ECC71** — Couleur SMASHI. Boutons principaux, barre de navigation, liens, éléments actifs
- `primary-dark` : **#1A9B50** — Navigation hover/actif, texte sur fond clair, titres
- `primary-light` : **#58D68D** — Hover boutons, focus rings, éléments interactifs secondaires
- `primary-50` : **#EAFAF1** — Fonds sélectionnés, backgrounds légers, lignes actives
- `primary-100` : **#D5F5E3** — Bordures actives, indicateurs subtils

**Couleurs par sport :**
- TENNIS : vert classique (#2ECC71 / bg: #D5F5E3 / texte: #1A9B50)
- PADEL : bleu (#3498DB / bg: #D6EAF8 / texte: #1B4F72)
- SQUASH : orange (#E67E22 / bg: #FDEBD0 / texte: #935116)

**Couleurs fonctionnelles :**
- `success` : **#27AE60** — Match confirmé, partie complète, validations
- `warning` : **#F39C12** — En attente de joueurs, demande en cours, alerte modérée
- `danger` : **#E74C3C** — Erreurs, annulations, refus, incompatibilité de niveau
- `info` : **#3498DB** — Notifications, informations, classement

**Couleurs neutres :**
- `neutral-900` : **#1A1A2E** — Texte principal
- `neutral-500` : **#6B7280** — Texte secondaire, labels
- `neutral-200` : **#E5E7EB** — Bordures, séparateurs
- `neutral-50` : **#F9FAFB** — Fond de page
- `white` : **#FFFFFF** — Fond des cartes et modals

### Couleurs de niveau joueur (badge)
- Débutant : vert clair (#A9DFBF / texte: #1E8449)
- Intermédiaire : bleu (#85C1E9 / texte: #1A5276)
- Avancé : orange (#F5B041 / texte: #7E5109)
- Expert/Compétiteur : rouge (#EC7063 / texte: #922B21)

### Navigation mobile (Tab Bar)
- Fond : **#FFFFFF** (blanc) avec ombre légère
- Icônes inactifs : **#6B7280** (neutral-500)
- Icône actif : **#2ECC71** (primary) + label en primary
- 5 onglets : Accueil, Rechercher, Créer partie, Mes matchs, Profil

## Règles de développement

### Langue
- **Toute l'interface est en français.** Tous les labels, boutons, messages, placeholders, toasts, notifications push.
- Le code (variables, fonctions, commentaires) reste en anglais.
- Les données métier (noms des enums, tables) restent en anglais.

### Design
- Style mobile-first, moderne et épuré (inspiré Strava/Hinge). Pas de décorations inutiles.
- Zones cliquables minimum 48px sur mobile
- Hauteur des boutons : 52px pour les actions principales, 44px secondaires
- Cards : fond blanc, border neutral-200, radius 16px, shadow-sm
- Badges sport : radius full (pill), couleurs selon le sport
- Badges niveau : radius 8px, couleurs selon le niveau
- Listes : séparateurs neutral-200, padding 16px
- Toasts : en bas de l'écran, 3 secondes
- Modals : overlay sombre 50%, radius 20px en haut, bottom-sheet style

### Architecture
- Structure : `src/screens/` pour les écrans, `src/lib/` pour la logique métier, `src/components/` pour les composants réutilisables
- Trois types d'utilisateurs : Joueur (app mobile), Club Manager (dashboard web), Admin (back-office web)
- API routes dans `src/api/`
- Le moteur de matching est dans `src/lib/matching-engine.ts`
- Le système de compatibilité est dans `src/lib/compatibility-engine.ts`

### Base de données
- Le schéma Prisma complet est dans `docs/SPEC_TECHNIQUE.md` section 6
- Relations principales : User → UserProfile → Match → MatchRequest → MatchFeedback
- Club → Court → TimeSlot → Booking
- UserCompatibility pour le cache des scores de compatibilité entre joueurs

### Données métier clés
- Région de lancement : PACA (Marseille, Aix-en-Provence, puis extension)
- 3 sports : Tennis, Padel, Squash
- Cible primaire : joueurs de padel passionnés (croissance +40%/an en France)
- Cible secondaire : joueurs de tennis et squash
- Forte dimension RSE : handisport (inclusion joueurs en situation de handicap)
- Forte dimension écologique : seconde main, partenariats locaux responsables
- Modèle freemium : app gratuite pour les joueurs
- Revenus : commissions réservation terrains (15%), abonnements clubs (30-150€/mois), sponsoring, affiliation, achats in-app
- Concurrence principale : Ten'Up (FFT), Padel Now, Anybuddy, Playtomic, Slice
- Différenciation : 3 sports en 1, handisport, matching par compatibilité (pas juste le niveau), anti-WhatsApp

### Fonctionnalités MVP (Phase 1 — priorité XL)
1. Profil joueur (sport, niveau auto-évalué ou FFT, localisation, disponibilités)
2. Créer une partie (sport, lieu, date, niveau souhaité, nombre de joueurs)
3. Rechercher et rejoindre une partie existante (filtres : sport, lieu, niveau, date)
4. Système de demandes (demander à rejoindre, accepter/refuser)
5. Notifications push (nouvelle partie compatible, demande reçue, match confirmé)
6. Historique des parties jouées

### Fonctionnalités Phase 2 (priorité L)
1. Matching intelligent (suggestions de parties basées sur profil + préférences)
2. Recherche de joueurs (annuaire, favoris, proposition directe)
3. Évaluation post-match simplifiée ("Le niveau du match était : trop faible / équilibré / trop élevé")
4. Score de compatibilité interne (zones de confort, pas ELO brut)

### Fonctionnalités Phase 3 (priorité M)
1. Réservation de terrains intégrée (API clubs)
2. Annuaire des clubs avec disponibilités temps réel
3. Dashboard club (stats adhérents, rétention, niveaux)
4. Tournois internes automatisés
5. Classement dynamique interne
6. Cashback joueurs après réservation
7. Marketplace seconde main (matériel sportif)
8. Système de parrainage

## Commandes

```bash
# Dev mobile
npx expo start

# Dev backend
npm run dev:server

# Database
npx prisma migrate dev
npx prisma generate
npx prisma studio

# Build
eas build --platform all
npm run build:server
docker compose up -d

# Tests
npm run test
npm run test:matching
```

## Sprints

Suivre la roadmap dans `docs/SPEC_TECHNIQUE.md` section 5 :
1. Setup projet + Auth (Firebase) + Profil joueur + Onboarding
2. CRUD Parties + Recherche + Filtres (sport, lieu, niveau, date)
3. Système de demandes + Notifications push
4. Matching intelligent v1 (suggestions basées sur profil)
5. Recherche joueurs + Favoris + Proposition directe
6. Évaluation post-match + Score de compatibilité v1
7. Intégration réservation terrains (API clubs pilotes PACA)
8. Dashboard club v1 + Stats
9. Tournois internes + Classement dynamique
10. Cashback + Parrainage + Marketplace seconde main
11. Tests, optimisations, beta publique PACA
12. Lancement App Store + Google Play
