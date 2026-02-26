# SPEC_TECHNIQUE.md — SMASHI

## 1. Vue d'ensemble

### 1.1 Objectif
SMASHI est une application mobile (iOS + Android) de mise en relation de joueurs de sports de raquettes (tennis, padel, squash) et de réservation de terrains. Elle résout le problème récurrent du "joueur manquant" et du chaos organisationnel des groupes WhatsApp, en offrant un matching intelligent par compatibilité de jeu.

### 1.2 Positionnement
- **Pour les joueurs** : trouver rapidement des partenaires compatibles, créer ou rejoindre une partie, réserver un terrain — en quelques clics.
- **Pour les clubs** : outil d'animation, de rétention et de visibilité. Données sur la pratique réelle (pas juste les réservations).
- **Modèle B2B2C** : gratuit côté joueur, monétisation côté club + partenaires + commissions.

### 1.3 Périmètre technique
- Application mobile React Native (Expo) — iOS + Android
- Backend API REST Node.js/Express
- Dashboard web club (React)
- Back-office admin (React)
- Base de données PostgreSQL
- Services cloud Azure

---

## 2. Architecture technique

### 2.1 Schéma global

```
┌──────────────────────────────────────────────────────┐
│                    CLIENTS                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  App Mobile  │  │ Dashboard    │  │ Back-office  │ │
│  │  (Expo/RN)   │  │ Club (React) │  │ Admin (React)│ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼────────────────┼─────────────────┼─────────┘
          │                │                 │
          ▼                ▼                 ▼
┌──────────────────────────────────────────────────────┐
│              API REST (Node.js / Express)             │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │  Auth     │ │  Matching    │ │  Booking         │  │
│  │  Module   │ │  Engine      │ │  Module          │  │
│  └──────────┘ └──────────────┘ └──────────────────┘  │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │  Users    │ │ Compatibility│ │  Notifications   │  │
│  │  Module   │ │  Engine      │ │  Module (FCM)    │  │
│  └──────────┘ └──────────────┘ └──────────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  PostgreSQL  │ │ Firebase │ │ Cloudflare   │
│  (Prisma)    │ │ Auth+FCM │ │ R2 (S3)      │
└──────────────┘ └──────────┘ └──────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│         APIs externes                │
│  Google Maps · Ten'Up/FFT · Doinsport│
│  Gestion Sports · Stripe            │
└──────────────────────────────────────┘
```

### 2.2 Structure du projet

```
smashi/
├── apps/
│   ├── mobile/                 # App React Native (Expo)
│   │   ├── src/
│   │   │   ├── screens/        # Écrans par feature
│   │   │   │   ├── auth/       # Login, Register, Onboarding
│   │   │   │   ├── home/       # Accueil, suggestions
│   │   │   │   ├── match/      # Créer/Rejoindre/Détail partie
│   │   │   │   ├── search/     # Recherche parties + joueurs
│   │   │   │   ├── profile/    # Profil, paramètres, historique
│   │   │   │   └── booking/    # Réservation terrains
│   │   │   ├── components/     # Composants réutilisables
│   │   │   │   ├── ui/         # Boutons, inputs, cards, badges
│   │   │   │   ├── match/      # MatchCard, MatchList, MatchFilters
│   │   │   │   ├── player/     # PlayerCard, PlayerBadge, LevelBadge
│   │   │   │   └── layout/     # TabBar, Header, SafeArea
│   │   │   ├── lib/            # Logique métier
│   │   │   │   ├── matching-engine.ts
│   │   │   │   ├── compatibility-engine.ts
│   │   │   │   └── geo-utils.ts
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── stores/         # State management (Zustand)
│   │   │   ├── services/       # Appels API
│   │   │   ├── types/          # Types TypeScript
│   │   │   └── constants/      # Couleurs, config, enums
│   │   ├── assets/             # Images, fonts, logo
│   │   └── app.json            # Config Expo
│   │
│   ├── api/                    # Backend Node.js/Express
│   │   ├── src/
│   │   │   ├── routes/         # Routes API REST
│   │   │   ├── controllers/    # Logique des endpoints
│   │   │   ├── services/       # Services métier
│   │   │   ├── middleware/     # Auth, validation, error handling
│   │   │   ├── lib/            # Matching engine (serveur)
│   │   │   └── utils/          # Helpers
│   │   └── prisma/
│   │       ├── schema.prisma   # Schéma BDD
│   │       ├── migrations/     # Migrations
│   │       └── seed.ts         # Données initiales
│   │
│   ├── dashboard/              # Dashboard Club (React + Vite)
│   │   └── src/
│   │       ├── pages/          # Stats, adhérents, terrains
│   │       └── components/
│   │
│   └── admin/                  # Back-office Admin (React + Vite)
│       └── src/
│           ├── pages/          # Gestion clubs, users, modération
│           └── components/
│
├── packages/
│   └── shared/                 # Types, constantes partagés
│       ├── types/
│       └── constants/
│
├── docs/
│   ├── SPEC_TECHNIQUE.md       # Ce fichier
│   ├── GUIDE_UX_UI.md          # Guide design
│   └── DONNEES_CLUBS.xlsx      # Clubs à importer
│
├── docker-compose.yml
├── package.json
└── turbo.json                  # Monorepo config
```

---

## 3. Modèle de données

### 3.1 Entités principales

**Joueur (User)** → profil, préférences, sports, niveau, localisation
**Partie (Match)** → sport, lieu, date/heure, niveau, nombre de joueurs, statut
**Demande (MatchRequest)** → joueur qui demande à rejoindre une partie
**Évaluation (MatchFeedback)** → ressenti post-match sur le niveau
**Compatibilité (UserCompatibility)** → score de compatibilité calculé entre deux joueurs
**Club** → infos, terrains, abonnement SMASHI
**Terrain (Court)** → type de surface, sport, disponibilités
**Réservation (Booking)** → créneau réservé, joueurs, paiement
**Notification** → push, in-app, historique

### 3.2 Enums clés

```typescript
enum Sport {
  TENNIS
  PADEL
  SQUASH
}

enum PlayerLevel {
  BEGINNER        // Débutant
  INTERMEDIATE    // Intermédiaire
  ADVANCED        // Avancé
  EXPERT          // Expert / Compétiteur
}

enum MatchStatus {
  OPEN            // Recherche de joueurs
  FULL            // Complet, en attente du match
  IN_PROGRESS     // Match en cours
  COMPLETED       // Match terminé
  CANCELLED       // Annulé
}

enum RequestStatus {
  PENDING         // En attente
  ACCEPTED        // Accepté
  REJECTED        // Refusé
  CANCELLED       // Annulé par le demandeur
}

enum MatchFeedbackLevel {
  TOO_LOW         // Trop faible
  BALANCED        // Équilibré
  TOO_HIGH        // Trop élevé
}

enum CourtSurface {
  CLAY            // Terre battue
  HARD            // Dur
  GRASS           // Herbe
  SYNTHETIC       // Synthétique
  INDOOR          // Intérieur
  OUTDOOR         // Extérieur
}

enum ClubSubscription {
  FREE            // Gratuit (visibilité basique)
  STANDARD        // 30-80€/mois (stats, matching)
  PREMIUM         // 80-150€/mois (tournois, reporting avancé)
}

enum UserRole {
  PLAYER          // Joueur (app mobile)
  CLUB_MANAGER    // Gestionnaire club (dashboard)
  ADMIN           // Administrateur (back-office)
}
```

---

## 4. Algorithme de matching

### 4.1 Principe
Le matching SMASHI ne repose pas sur un simple classement ELO. Il calcule une **compatibilité de jeu** multi-critères entre joueurs, en prenant en compte :

1. **Niveau** (40% du score) — auto-évaluation, classement FFT/Ten'Up, feedback post-match
2. **Proximité géographique** (25%) — distance entre joueurs et/ou entre joueur et lieu de la partie
3. **Disponibilités** (20%) — créneaux compatibles
4. **Historique social** (15%) — parties déjà jouées ensemble, favoris, taux d'acceptation

### 4.2 Score de compatibilité

```typescript
interface CompatibilityScore {
  overall: number;        // 0-100, score global
  levelMatch: number;     // 0-100, compatibilité de niveau
  proximity: number;      // 0-100, proximité géographique
  availability: number;   // 0-100, compatibilité horaire
  socialFit: number;      // 0-100, historique social
}
```

### 4.3 Évaluation du niveau joueur

Le niveau d'un joueur est une **zone de confort**, pas un score fixe.

**Phase 1 (cold start)** : auto-évaluation à l'inscription (4 niveaux) + classement FFT optionnel
**Phase 2 (warm)** : ajustement par les feedbacks post-match (agrégation des ressentis)
**Phase 3 (mature)** : zone de confort dynamique calculée sur les X derniers matchs

```
Exemple : "Ce joueur performe bien dans des groupes de niveau 3.2 – 3.6"
```

### 4.4 Matching de partie

Quand un joueur cherche une partie ou crée une partie :

1. Filtrer par sport + zone géographique (rayon configurable, défaut 20km)
2. Filtrer par date/heure
3. Calculer le score de compatibilité de niveau
4. Trier par score global décroissant
5. Mettre en avant les parties où le joueur a des "amis" ou favoris

### 4.5 Évaluation post-match

Après chaque partie terminée, 1 seule question :
> "Le niveau du match était : Trop faible / Équilibré / Trop élevé"

Pas de notation individuelle. Le système apprend les combinaisons qui produisent des matchs équilibrés.

---

## 5. Roadmap (Sprints)

### Sprint 1 — Setup + Auth + Profil joueur (2 semaines)
- [x] Init monorepo (Turborepo)
- [ ] Setup Expo + NativeWind
- [ ] Setup Express + Prisma + PostgreSQL
- [ ] Firebase Auth (email, Google, Apple)
- [ ] Onboarding joueur (choix sport, niveau, localisation, dispo)
- [ ] Écran profil (lecture + édition)
- [ ] Upload avatar (Cloudflare R2)

### Sprint 2 — CRUD Parties + Recherche (2 semaines)
- [ ] Créer une partie (sport, lieu via Google Places, date, niveau, nb joueurs)
- [ ] Liste des parties disponibles (avec filtres)
- [ ] Détail d'une partie
- [ ] Carte des parties proches (Google Maps)
- [ ] Recherche full-text (lieu, club, joueur)

### Sprint 3 — Système de demandes + Notifications (2 semaines)
- [ ] Demander à rejoindre une partie
- [ ] Accepter / Refuser une demande (créateur)
- [ ] Notifications push (FCM) : nouvelle partie compatible, demande reçue, match confirmé
- [ ] Notifications in-app
- [ ] Statut de la partie (OPEN → FULL → IN_PROGRESS → COMPLETED)

### Sprint 4 — Matching intelligent v1 (2 semaines)
- [ ] Suggestions de parties sur l'écran d'accueil
- [ ] Score de compatibilité basique (niveau + proximité)
- [ ] Tri intelligent des résultats de recherche
- [ ] Badge "Match recommandé" sur les parties compatibles

### Sprint 5 — Recherche joueurs + Favoris (1 semaine)
- [ ] Annuaire des joueurs (filtres : sport, niveau, localisation)
- [ ] Fiche joueur publique
- [ ] Ajouter en favoris
- [ ] Proposer une partie directement à un joueur

### Sprint 6 — Évaluation post-match + Compatibilité v1 (2 semaines)
- [ ] Évaluation post-match (1 question : trop faible / équilibré / trop élevé)
- [ ] Calcul du score de compatibilité (agrégation feedbacks)
- [ ] Ajustement dynamique de la zone de confort niveau
- [ ] Amélioration du matching avec les données de feedback

### Sprint 7 — Réservation terrains (3 semaines)
- [ ] Annuaire des clubs (infos, terrains, horaires, surfaces)
- [ ] Disponibilités temps réel (API Doinsport / Gestion Sports pilotes)
- [ ] Réservation de créneau depuis l'app
- [ ] Paiement via Stripe (commission 15%)
- [ ] Confirmation + envoi détails

### Sprint 8 — Dashboard Club v1 (2 semaines)
- [ ] Authentification club manager
- [ ] Vue d'ensemble : nb parties organisées, joueurs actifs, taux remplissage
- [ ] Liste des adhérents + activité
- [ ] Alertes : joueurs inactifs, nouveaux adhérents isolés
- [ ] Gestion des terrains et créneaux

### Sprint 9 — Tournois + Classement (2 semaines)
- [ ] Création de tournoi interne (club ou joueur)
- [ ] Arbre de tournoi automatisé
- [ ] Classement dynamique interne (par club, par zone)
- [ ] Historique et palmarès

### Sprint 10 — Cashback + Parrainage + Marketplace (2 semaines)
- [ ] Cashback après réservation de terrain
- [ ] Système de parrainage (paliers : 10, 50, 100 filleuls)
- [ ] Marketplace seconde main (dépôt + achat matériel sportif)
- [ ] Espace partenaires / sponsors (visibilité contextuelle)

### Sprint 11 — Handisport + RSE (1 semaine)
- [ ] Filtre handisport dans le profil et la recherche
- [ ] Badge "Club handisport friendly"
- [ ] Partenariats associations locales
- [ ] Section don / engagement écologique

### Sprint 12 — Tests + Optimisations + Beta (2 semaines)
- [ ] Tests unitaires, intégration, e2e
- [ ] Optimisation performances (temps de chargement < 2s)
- [ ] Beta privée PACA (10 clubs pilotes)
- [ ] Collecte feedbacks + itérations
- [ ] Préparation soumission App Store + Google Play

---

## 6. Schéma Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== UTILISATEURS ====================

model User {
  id                String            @id @default(cuid())
  email             String            @unique
  firebaseUid       String            @unique
  firstName         String
  lastName          String
  avatarUrl         String?
  role              UserRole          @default(PLAYER)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  profile           UserProfile?
  createdMatches    Match[]           @relation("MatchCreator")
  matchRequests     MatchRequest[]
  matchPlayers      MatchPlayer[]
  feedbacksGiven    MatchFeedback[]   @relation("FeedbackGiver")
  favoriteUsers     UserFavorite[]    @relation("UserFavoriting")
  favoritedBy       UserFavorite[]    @relation("UserFavorited")
  notifications     Notification[]
  bookings          Booking[]

  compatibilityA    UserCompatibility[] @relation("CompatibilityUserA")
  compatibilityB    UserCompatibility[] @relation("CompatibilityUserB")

  clubManager       ClubManager?
}

model UserProfile {
  id                String            @id @default(cuid())
  userId            String            @unique
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  sports            Sport[]           // Sports pratiqués
  primarySport      Sport?            // Sport principal
  level             PlayerLevel       @default(BEGINNER)
  fftRanking        String?           // Classement FFT optionnel
  tenupScore        Float?            // Score Ten'Up optionnel

  latitude          Float?
  longitude         Float?
  city              String?
  postalCode        String?
  searchRadius      Int               @default(20) // km

  availabilities    Json?             // Créneaux de disponibilité type
  preferredPosition String?           // Padel : gauche/droite
  isHandisport      Boolean           @default(false)
  handicapDetails   String?

  // Zone de confort calculée
  comfortLevelMin   Float?
  comfortLevelMax   Float?
  totalMatchesPlayed Int              @default(0)

  bio               String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

// ==================== PARTIES ====================

model Match {
  id                String            @id @default(cuid())
  creatorId         String
  creator           User              @relation("MatchCreator", fields: [creatorId], references: [id])

  sport             Sport
  title             String?
  description       String?

  // Lieu
  locationName      String            // Nom du lieu/club
  latitude          Float
  longitude         Float
  clubId            String?
  club              Club?             @relation(fields: [clubId], references: [id])
  courtId           String?
  court             Court?            @relation(fields: [courtId], references: [id])

  // Date/heure
  scheduledAt       DateTime
  durationMinutes   Int               @default(60)

  // Niveau
  requiredLevel     PlayerLevel?
  levelFlexibility  Int               @default(1) // ±1 niveau accepté

  // Joueurs
  maxPlayers        Int               // 2 (tennis simple), 4 (padel/double), etc.
  currentPlayers    Int               @default(1) // Le créateur compte
  status            MatchStatus       @default(OPEN)
  isPublic          Boolean           @default(true)

  players           MatchPlayer[]
  requests          MatchRequest[]
  feedbacks         MatchFeedback[]
  booking           Booking?

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([sport, status, scheduledAt])
  @@index([latitude, longitude])
}

model MatchPlayer {
  id                String            @id @default(cuid())
  matchId           String
  match             Match             @relation(fields: [matchId], references: [id], onDelete: Cascade)
  userId            String
  user              User              @relation(fields: [userId], references: [id])
  joinedAt          DateTime          @default(now())

  @@unique([matchId, userId])
}

model MatchRequest {
  id                String            @id @default(cuid())
  matchId           String
  match             Match             @relation(fields: [matchId], references: [id], onDelete: Cascade)
  userId            String
  user              User              @relation(fields: [userId], references: [id])
  status            RequestStatus     @default(PENDING)
  message           String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@unique([matchId, userId])
}

model MatchFeedback {
  id                String            @id @default(cuid())
  matchId           String
  match             Match             @relation(fields: [matchId], references: [id], onDelete: Cascade)
  userId            String
  user              User              @relation("FeedbackGiver", fields: [userId], references: [id])
  levelRating       MatchFeedbackLevel // Trop faible / Équilibré / Trop élevé
  comment           String?
  createdAt         DateTime          @default(now())

  @@unique([matchId, userId])
}

// ==================== COMPATIBILITÉ ====================

model UserCompatibility {
  id                String            @id @default(cuid())
  userAId           String
  userA             User              @relation("CompatibilityUserA", fields: [userAId], references: [id])
  userBId           String
  userB             User              @relation("CompatibilityUserB", fields: [userBId], references: [id])

  overallScore      Float             // 0-100
  levelScore        Float             // 0-100
  proximityScore    Float             // 0-100
  socialScore       Float             // 0-100
  matchesPlayed     Int               @default(0)
  lastPlayedAt      DateTime?

  calculatedAt      DateTime          @default(now())

  @@unique([userAId, userBId])
  @@index([overallScore(sort: Desc)])
}

model UserFavorite {
  id                String            @id @default(cuid())
  userId            String
  user              User              @relation("UserFavoriting", fields: [userId], references: [id])
  favoriteId        String
  favorite          User              @relation("UserFavorited", fields: [favoriteId], references: [id])
  createdAt         DateTime          @default(now())

  @@unique([userId, favoriteId])
}

// ==================== CLUBS & TERRAINS ====================

model Club {
  id                String            @id @default(cuid())
  name              String
  description       String?
  address           String
  city              String
  postalCode        String
  latitude          Float
  longitude         Float
  phone             String?
  email             String?
  website           String?
  logoUrl           String?

  sports            Sport[]
  isHandisportFriendly Boolean        @default(false)
  subscription      ClubSubscription  @default(FREE)

  courts            Court[]
  matches           Match[]
  bookings          Booking[]
  managers          ClubManager[]

  // Intégration ERP
  erpType           String?           // "doinsport", "gestion_sports", "custom"
  erpApiUrl         String?
  erpApiKey         String?

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([city])
  @@index([latitude, longitude])
}

model Court {
  id                String            @id @default(cuid())
  clubId            String
  club              Club              @relation(fields: [clubId], references: [id], onDelete: Cascade)
  name              String            // "Terrain 1", "Court A"
  sport             Sport
  surface           CourtSurface?
  isIndoor          Boolean           @default(false)
  isLighted         Boolean           @default(true)
  isActive          Boolean           @default(true)

  matches           Match[]
  bookings          Booking[]
  timeSlots         TimeSlot[]

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

model TimeSlot {
  id                String            @id @default(cuid())
  courtId           String
  court             Court             @relation(fields: [courtId], references: [id], onDelete: Cascade)
  dayOfWeek         Int               // 0=Lundi, 6=Dimanche
  startTime         String            // "08:00"
  endTime           String            // "09:00"
  priceInCents      Int               // Prix en centimes
  isAvailable       Boolean           @default(true)
}

model ClubManager {
  id                String            @id @default(cuid())
  userId            String            @unique
  user              User              @relation(fields: [userId], references: [id])
  clubId            String
  club              Club              @relation(fields: [clubId], references: [id])
  role              String            @default("manager") // "manager", "owner"
  createdAt         DateTime          @default(now())
}

// ==================== RÉSERVATIONS ====================

model Booking {
  id                String            @id @default(cuid())
  matchId           String?           @unique
  match             Match?            @relation(fields: [matchId], references: [id])
  userId            String
  user              User              @relation(fields: [userId], references: [id])
  clubId            String
  club              Club              @relation(fields: [clubId], references: [id])
  courtId           String
  court             Court             @relation(fields: [courtId], references: [id])

  date              DateTime
  startTime         String
  endTime           String
  priceInCents      Int
  commissionInCents Int               // Commission SMASHI (15%)
  stripePaymentId   String?
  status            BookingStatus     @default(PENDING)

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

// ==================== NOTIFICATIONS ====================

model Notification {
  id                String            @id @default(cuid())
  userId            String
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  type              NotificationType
  title             String
  body              String
  data              Json?             // Metadata (matchId, requestId, etc.)
  isRead            Boolean           @default(false)
  createdAt         DateTime          @default(now())
}

// ==================== ENUMS ====================

enum Sport {
  TENNIS
  PADEL
  SQUASH
}

enum PlayerLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum MatchStatus {
  OPEN
  FULL
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum RequestStatus {
  PENDING
  ACCEPTED
  REJECTED
  CANCELLED
}

enum MatchFeedbackLevel {
  TOO_LOW
  BALANCED
  TOO_HIGH
}

enum CourtSurface {
  CLAY
  HARD
  GRASS
  SYNTHETIC
}

enum ClubSubscription {
  FREE
  STANDARD
  PREMIUM
}

enum UserRole {
  PLAYER
  CLUB_MANAGER
  ADMIN
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum NotificationType {
  MATCH_SUGGESTION       // Partie compatible suggérée
  REQUEST_RECEIVED       // Demande de rejoindre reçue
  REQUEST_ACCEPTED       // Demande acceptée
  REQUEST_REJECTED       // Demande refusée
  MATCH_FULL             // Partie complète
  MATCH_REMINDER         // Rappel avant match
  MATCH_COMPLETED        // Match terminé, feedback demandé
  BOOKING_CONFIRMED      // Réservation confirmée
  GENERAL                // Message général
}
```

---

## 7. API Endpoints (principaux)

### 7.1 Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription (Firebase token → création User) |
| POST | `/api/auth/login` | Connexion (Firebase token → JWT) |
| GET | `/api/auth/me` | Profil de l'utilisateur connecté |

### 7.2 Users
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/users` | Liste des joueurs (filtres: sport, niveau, ville) |
| GET | `/api/users/:id` | Fiche joueur publique |
| PATCH | `/api/users/profile` | Modifier son profil |
| POST | `/api/users/favorites/:id` | Ajouter un joueur en favori |
| DELETE | `/api/users/favorites/:id` | Retirer un favori |
| GET | `/api/users/favorites` | Liste de mes favoris |

### 7.3 Matches (Parties)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/matches` | Créer une partie |
| GET | `/api/matches` | Liste des parties (filtres: sport, lieu, date, niveau) |
| GET | `/api/matches/suggestions` | Parties suggérées pour moi |
| GET | `/api/matches/:id` | Détail d'une partie |
| PATCH | `/api/matches/:id` | Modifier une partie (créateur) |
| DELETE | `/api/matches/:id` | Annuler une partie (créateur) |
| POST | `/api/matches/:id/join` | Demander à rejoindre |
| POST | `/api/matches/:id/requests/:reqId/accept` | Accepter une demande |
| POST | `/api/matches/:id/requests/:reqId/reject` | Refuser une demande |
| POST | `/api/matches/:id/complete` | Marquer comme terminé |
| POST | `/api/matches/:id/feedback` | Donner son évaluation post-match |

### 7.4 Clubs
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/clubs` | Annuaire des clubs (filtres: ville, sport, handisport) |
| GET | `/api/clubs/:id` | Détail club + terrains |
| GET | `/api/clubs/:id/courts` | Terrains disponibles |
| GET | `/api/clubs/:id/availability` | Créneaux disponibles (date) |

### 7.5 Bookings
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/bookings` | Réserver un créneau |
| GET | `/api/bookings` | Mes réservations |
| DELETE | `/api/bookings/:id` | Annuler une réservation |

### 7.6 Notifications
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/notifications` | Mes notifications |
| PATCH | `/api/notifications/:id/read` | Marquer comme lue |
| PATCH | `/api/notifications/read-all` | Tout marquer comme lu |

---

## 8. Intégrations externes

### 8.1 Firebase Auth
- Inscription/connexion email + Google + Apple
- Vérification email
- Token Firebase → vérification côté serveur → émission JWT SMASHI

### 8.2 Google Maps Platform
- **Geocoding** : conversion adresse → coordonnées
- **Places Autocomplete** : saisie de lieu pour créer une partie
- **Distance Matrix** : calcul de distances entre joueurs
- **Maps SDK** : affichage carte des parties proches

### 8.3 API Clubs (ERP)
- **Doinsport** : API REST pour disponibilités terrains et réservations
- **Gestion Sports** : API REST pour clubs utilisant cette solution
- Approche **agnostique** : adaptateur par ERP, le club n'a pas à changer de système

### 8.4 Ten'Up / FFT
- Récupération du classement FFT/padel d'un joueur (si disponible via API ou saisie manuelle)
- Utilisé comme "seed" pour le score de compatibilité initial

### 8.5 Stripe
- Paiement des réservations de terrain
- Commission SMASHI automatique (15%)
- Stripe Connect pour redistribution aux clubs

### 8.6 Firebase Cloud Messaging (FCM)
- Notifications push iOS + Android
- Topics par ville/sport pour notifications de nouvelles parties

---

## 9. Sécurité & Performance

### 9.1 Authentification
- Firebase Auth + JWT signé côté serveur
- Refresh token avec rotation
- Rate limiting sur les endpoints sensibles

### 9.2 Données personnelles (RGPD)
- Consentement explicite à l'inscription
- Droit de suppression du compte et des données
- Données de localisation : stockage minimal, consentement explicite
- Pas de partage de données avec des tiers non déclarés

### 9.3 Performance
- Temps de chargement cible : < 2 secondes par écran
- Cache local (AsyncStorage) pour le profil et les parties en cours
- Pagination des listes (20 items par page)
- Index BDD sur les colonnes de recherche fréquentes
- CDN Cloudflare pour les assets statiques

### 9.4 Monitoring
- Logging structuré (Winston)
- Sentry pour le crash reporting (mobile + API)
- Analytics : nombre de matchs créés, taux de remplissage, rétention joueur
