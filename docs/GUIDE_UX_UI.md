# GUIDE_UX_UI.md — SMASHI

## 1. Philosophie design

### 1.1 Principes fondateurs
- **Mobile-first** : l'expérience est pensée pour le smartphone. Le web (dashboard club, admin) est secondaire.
- **Simplicité radicale** : chaque écran a UN objectif. Pas de surcharge. Inspiré de Strava (communauté sportive), Hinge (matching intelligent) et Airbnb (réservation fluide).
- **Rapidité** : un joueur doit pouvoir créer ou rejoindre une partie en moins de 30 secondes.
- **Inclusivité** : handisport intégré nativement, pas comme un ajout. Accessibilité AA minimum.
- **Français partout** : toute l'interface utilisateur est en français. Aucune exception.

### 1.2 Ton de voix
- Dynamique mais pas agressif. Sport mais pas "bro culture".
- Tutoiement dans l'app (cible 18-45 ans, sportifs connectés).
- Messages courts, orientés action : "Rejoins cette partie" > "Vous pouvez maintenant rejoindre cette partie".
- Emojis sportifs utilisés avec parcimonie dans les notifications (🎾🏸💪).

---

## 2. Design System

### 2.1 Typographie

| Utilisation | Font | Poids | Taille |
|-------------|------|-------|--------|
| Titre écran (H1) | Inter | Bold (700) | 28px |
| Titre section (H2) | Inter | SemiBold (600) | 22px |
| Sous-titre (H3) | Inter | SemiBold (600) | 18px |
| Corps de texte | Inter | Regular (400) | 16px |
| Texte secondaire | Inter | Regular (400) | 14px |
| Label / caption | Inter | Medium (500) | 12px |
| Chiffres / stats | JetBrains Mono | Medium (500) | 16-28px |
| Bouton principal | Inter | SemiBold (600) | 16px |
| Bouton secondaire | Inter | Medium (500) | 14px |

### 2.2 Palette de couleurs

#### Couleurs principales
| Nom | Hex | Usage |
|-----|-----|-------|
| `primary` | #2ECC71 | Boutons principaux, tab bar active, liens, CTA |
| `primary-dark` | #1A9B50 | Hover, appuyé, titres sur fond clair |
| `primary-light` | #58D68D | Focus rings, éléments interactifs secondaires |
| `primary-50` | #EAFAF1 | Background léger, sélection, row active |
| `primary-100` | #D5F5E3 | Bordures actives, indicateurs subtils |

#### Couleurs par sport
| Sport | Couleur | Background | Texte |
|-------|---------|------------|-------|
| Tennis | #2ECC71 | #D5F5E3 | #1A9B50 |
| Padel | #3498DB | #D6EAF8 | #1B4F72 |
| Squash | #E67E22 | #FDEBD0 | #935116 |

#### Couleurs de niveau
| Niveau | Couleur | Background | Texte |
|--------|---------|------------|-------|
| Débutant | #27AE60 | #A9DFBF | #1E8449 |
| Intermédiaire | #2E86C1 | #85C1E9 | #1A5276 |
| Avancé | #F39C12 | #F5B041 | #7E5109 |
| Expert | #E74C3C | #EC7063 | #922B21 |

#### Couleurs fonctionnelles
| Nom | Hex | Usage |
|-----|-----|-------|
| `success` | #27AE60 | Match confirmé, validation, partie complète |
| `warning` | #F39C12 | En attente, demande en cours |
| `danger` | #E74C3C | Erreur, annulation, refus |
| `info` | #3498DB | Notification, information |

#### Couleurs neutres
| Nom | Hex | Usage |
|-----|-----|-------|
| `neutral-900` | #1A1A2E | Texte principal |
| `neutral-700` | #374151 | Texte important secondaire |
| `neutral-500` | #6B7280 | Texte secondaire, labels |
| `neutral-300` | #D1D5DB | Bordures légères, placeholder |
| `neutral-200` | #E5E7EB | Séparateurs, bordures cards |
| `neutral-100` | #F3F4F6 | Background sections |
| `neutral-50` | #F9FAFB | Background écran |
| `white` | #FFFFFF | Background cards, modals |

### 2.3 Espacement

| Nom | Valeur | Usage |
|-----|--------|-------|
| `xs` | 4px | Espacement minimal interne |
| `sm` | 8px | Espacement entre éléments proches |
| `md` | 16px | Padding cards, marges standard |
| `lg` | 24px | Espacement entre sections |
| `xl` | 32px | Marges écran, séparations majeures |
| `2xl` | 48px | Espacement top/bottom écran |

### 2.4 Composants UI

#### Boutons
| Type | Hauteur | Radius | Style |
|------|---------|--------|-------|
| Principal | 52px | 12px | Fond primary, texte blanc, shadow-sm |
| Secondaire | 44px | 12px | Fond blanc, bordure primary, texte primary |
| Tertiaire | 40px | 8px | Pas de fond, texte primary, underline au hover |
| Danger | 52px | 12px | Fond danger, texte blanc |
| Icon button | 44x44px | 22px (rond) | Fond primary-50, icône primary |

#### Cards
| Type | Radius | Shadow | Padding |
|------|--------|--------|---------|
| Match card | 16px | shadow-sm | 16px |
| Player card | 12px | shadow-xs | 12px |
| Club card | 16px | shadow-sm | 16px |
| Stat card | 12px | none, border | 16px |

#### Badges
| Type | Radius | Taille | Style |
|------|--------|--------|-------|
| Badge sport | full (pill) | 24px hauteur | Couleur sport + fond léger |
| Badge niveau | 8px | 28px hauteur | Couleur niveau + fond léger |
| Badge statut | full (pill) | 24px hauteur | success/warning/danger |
| Badge joueurs | full (pill) | 20px hauteur | Compteur "3/4" |

#### Inputs
| Type | Hauteur | Radius | Style |
|------|---------|--------|-------|
| Text input | 48px | 12px | Bordure neutral-200, focus: primary |
| Search bar | 44px | 22px (pill) | Fond neutral-100, icône loupe |
| Select / Dropdown | 48px | 12px | Bordure neutral-200, icône chevron |
| Date picker | 48px | 12px | Style natif plateforme |

#### Divers
| Composant | Style |
|-----------|-------|
| Toasts | Bottom center, 3 secondes, radius 12px, shadow-md |
| Modals / Bottom sheets | Radius 20px en haut, overlay 50% noir |
| Skeleton loading | Fond neutral-100, animation pulse |
| Empty state | Illustration + texte + CTA primaire |
| Pull to refresh | Spinner primary |

---

## 3. Parcours utilisateurs

### 3.1 Onboarding (première ouverture)

```
[Splash screen SMASHI]
        │
        ▼
[Écran bienvenue — 3 slides]
  • "Trouve des joueurs de ton niveau"
  • "Réserve un terrain en 1 clic"
  • "Rejoins la communauté SMASHI"
        │
        ▼
[Inscription / Connexion]
  • Email + mot de passe
  • Google Sign-In
  • Apple Sign-In
        │
        ▼
[Onboarding profil — 4 étapes]
  1. "Quel(s) sport(s) pratiques-tu ?" → choix multiple (Tennis, Padel, Squash)
  2. "Quel est ton niveau ?" → choix par sport (Débutant → Expert) + classement FFT optionnel
  3. "Où joues-tu ?" → géolocalisation auto ou saisie ville + rayon
  4. "Quand es-tu dispo ?" → grille semaine simplifiée (matin/après-midi/soir)
        │
        ▼
[Accueil — parties suggérées]
```

### 3.2 Créer une partie

```
[Tab "+" ou bouton "Créer une partie"]
        │
        ▼
[Étape 1 — Sport]
  → Tennis / Padel / Squash (sélection rapide)
        │
        ▼
[Étape 2 — Lieu]
  → Recherche Google Places (club, ville, adresse)
  → Ou "Près de moi" (géolocalisation)
        │
        ▼
[Étape 3 — Date & Heure]
  → Sélection date (calendrier compact)
  → Sélection heure (scroll horizontal)
        │
        ▼
[Étape 4 — Niveau & Joueurs]
  → Niveau souhaité (Débutant → Expert)
  → Flexibilité (± 1 niveau par défaut)
  → Nombre de joueurs (2 ou 4, selon le sport)
  → Titre optionnel ("Partie cool après le boulot")
        │
        ▼
[Résumé + Publier]
  → Confirmation visuelle de tous les paramètres
  → Bouton "Publier la partie" (CTA principal)
        │
        ▼
[Partie créée — écran de détail]
  → En attente de joueurs
  → Partage possible (lien ou message)
```

### 3.3 Rechercher et rejoindre une partie

```
[Tab "Rechercher"]
        │
        ▼
[Barre de recherche + filtres rapides]
  → Filtres : Sport | Date | Niveau | Distance
  → Vue liste (défaut) ou vue carte
        │
        ▼
[Liste de parties — MatchCard]
  → Sport (badge coloré)
  → Lieu + distance
  → Date + heure
  → Niveau (badge)
  → Joueurs (2/4 avec avatars)
  → Badge "Recommandé" si compatibilité haute
        │
        ▼
[Tap → Détail de la partie]
  → Infos complètes
  → Profils des joueurs inscrits
  → Carte du lieu
  → Bouton "Demander à rejoindre"
        │
        ▼
[Demande envoyée]
  → Notification push au créateur
  → Statut "En attente" visible
        │
        ▼
[Notification : demande acceptée/refusée]
  → Si accepté : apparaît dans "Mes matchs"
```

### 3.4 Gérer les demandes (créateur)

```
[Notification : "Julien veut rejoindre ta partie"]
        │
        ▼
[Écran détail partie — section "Demandes"]
  → PlayerCard du demandeur
    • Avatar, prénom, niveau, distance
    • Score de compatibilité (si disponible)
    • Bouton "Accepter" (vert) + "Refuser" (gris)
        │
        ▼
[Action]
  → Accepter → joueur ajouté, notification push
  → Refuser → notification push polie
  → Si partie complète → statut passe à FULL
```

### 3.5 Post-match (évaluation)

```
[Notification : "Ta partie est terminée ! Comment c'était ?"]
        │
        ▼
[Écran évaluation (bottom sheet)]
  → "Le niveau du match était :"
    • 😐 Trop faible
    • 😊 Équilibré
    • 😅 Trop élevé
  → Commentaire optionnel (textarea)
  → Bouton "Envoyer"
        │
        ▼
[Merci ! Score de compatibilité mis à jour]
```

---

## 4. Écrans principaux (wireframes textuels)

### 4.1 Accueil

```
┌──────────────────────────────────┐
│  🎾 Bonjour Maxime               │ ← Prénom + avatar
│                                   │
│  ┌───────────────────────────┐   │
│  │ 📍 Prochaine partie       │   │ ← Card mise en avant
│  │ Padel · Aix · Demain 18h │   │
│  │ 3/4 joueurs · Interméd.  │   │
│  │ [Voir les détails →]      │   │
│  └───────────────────────────┘   │
│                                   │
│  Parties recommandées pour toi    │ ← Section scroll horizontal
│  ┌──────┐ ┌──────┐ ┌──────┐     │
│  │Match1│ │Match2│ │Match3│     │
│  └──────┘ └──────┘ └──────┘     │
│                                   │
│  Près de toi                      │ ← Section liste verticale
│  ┌───────────────────────────┐   │
│  │ 🎾 Tennis · Club X · 3km │   │
│  │ Aujourd'hui 14h · 1/2    │   │
│  └───────────────────────────┘   │
│  ┌───────────────────────────┐   │
│  │ 🏸 Padel · Club Y · 5km  │   │
│  │ Demain 19h · 2/4         │   │
│  └───────────────────────────┘   │
│                                   │
├──────────────────────────────────┤
│ 🏠  🔍  ➕  📋  👤             │ ← Tab bar
│Accueil Chercher Créer Matchs Profil│
└──────────────────────────────────┘
```

### 4.2 MatchCard (composant)

```
┌──────────────────────────────────┐
│  [Badge Sport]  [Badge Niveau]    │
│                                   │
│  📍 Nom du lieu                   │
│  📅 Mercredi 5 mars · 18h30      │
│  ⏱ 1h · 🏃 2.3 km               │
│                                   │
│  👤👤👤  3/4 joueurs             │ ← Avatars empilés
│                                   │
│  ★ Recommandé pour toi           │ ← Optionnel, si score > 75
└──────────────────────────────────┘
```

### 4.3 Détail de partie

```
┌──────────────────────────────────┐
│  ← Retour          [Partager 📤] │
│                                   │
│  [Badge Sport]  [Badge Niveau]    │
│  "Partie cool après le boulot"   │ ← Titre optionnel
│                                   │
│  ┌─────────────────────────────┐ │
│  │ 🗺 Carte du lieu             │ │ ← Mini carte
│  │                              │ │
│  └─────────────────────────────┘ │
│  📍 Padel Club Aix · 2.3 km     │
│  📅 Mercredi 5 mars · 18h30     │
│  ⏱ Durée : 1h                   │
│  🎯 Niveau : Intermédiaire ±1   │
│                                   │
│  Joueurs (3/4)                    │
│  ┌──────────────────────────┐    │
│  │ 👤 Maxime G. · Avancé    │    │
│  │ 👤 Julien D. · Intermé.  │    │
│  │ 👤 Sarah M. · Intermé.   │    │
│  │ 🔲 Place disponible       │    │
│  └──────────────────────────┘    │
│                                   │
│  Demandes en attente (1)          │ ← Visible par le créateur
│  ┌──────────────────────────┐    │
│  │ 👤 Lucas T. · Intermé.   │    │
│  │ Compatibilité : 82%      │    │
│  │ [Accepter] [Refuser]     │    │
│  └──────────────────────────┘    │
│                                   │
│  ┌──────────────────────────┐    │
│  │   Demander à rejoindre    │    │ ← CTA principal (non-créateur)
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

### 4.4 Profil joueur

```
┌──────────────────────────────────┐
│          ┌─────┐                  │
│          │ 📷  │ ← Avatar         │
│          └─────┘                  │
│     Maxime GAZEL                  │
│     📍 Marseille · 🏸 Padel      │
│                                   │
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │42 matchs│ │12 favoris│ │4.8 ⭐│ │ ← Stats rapides
│  └────────┘ └────────┘ └──────┘ │
│                                   │
│  Sports & Niveaux                 │
│  🎾 Tennis · Intermédiaire       │
│  🏸 Padel · Avancé               │
│                                   │
│  Disponibilités                   │
│  Soir en semaine · Week-end AM   │
│                                   │
│  "Joueur passionné de padel,     │
│   toujours partant pour une      │
│   partie entre midi et 14h !"    │
│                                   │
│  Historique des parties →         │
│  Paramètres →                     │
│  Aide & Contact →                 │
│  Déconnexion                      │
└──────────────────────────────────┘
```

### 4.5 Création de partie (étape sport)

```
┌──────────────────────────────────┐
│  Créer une partie                 │
│                                   │
│  Quel sport ?                     │
│                                   │
│  ┌──────────────────────────┐    │
│  │  🎾  Tennis               │    │ ← Card sélectionnable
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │  🏸  Padel                │    │ ← Card sélectionnable
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │  🏓  Squash               │    │ ← Card sélectionnable
│  └──────────────────────────┘    │
│                                   │
│  ┌──────────────────────────┐    │
│  │        Suivant →          │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

---

## 5. Labels et textes français

### 5.1 Navigation (Tab Bar)
| Onglet | Label | Icône |
|--------|-------|-------|
| Accueil | Accueil | Home (Lucide) |
| Rechercher | Chercher | Search (Lucide) |
| Créer | + | Plus (Lucide) |
| Mes matchs | Matchs | Calendar (Lucide) |
| Profil | Profil | User (Lucide) |

### 5.2 Boutons courants
| Action | Label |
|--------|-------|
| Créer une partie | "Créer une partie" |
| Rechercher | "Rechercher" |
| Rejoindre | "Demander à rejoindre" |
| Accepter | "Accepter" |
| Refuser | "Refuser" |
| Publier | "Publier la partie" |
| Annuler | "Annuler" |
| Modifier | "Modifier" |
| Partager | "Partager" |
| Envoyer | "Envoyer" |
| Voir tout | "Voir tout" |
| Retour | "Retour" |
| Déconnexion | "Se déconnecter" |

### 5.3 Labels de champs
| Champ | Label | Placeholder |
|-------|-------|-------------|
| Email | "Adresse e-mail" | "ton@email.com" |
| Mot de passe | "Mot de passe" | "••••••••" |
| Prénom | "Prénom" | "Ton prénom" |
| Nom | "Nom" | "Ton nom" |
| Ville | "Ville" | "Marseille, Aix-en-Provence..." |
| Niveau | "Ton niveau" | — |
| Sport | "Ton sport" | — |
| Date | "Date" | "Sélectionne une date" |
| Heure | "Heure" | "Sélectionne un créneau" |
| Lieu | "Lieu" | "Nom du club ou adresse" |
| Bio | "À propos de toi" | "Parle-nous de toi..." |

### 5.4 Messages système
| Contexte | Message |
|----------|---------|
| Inscription réussie | "Bienvenue sur SMASHI ! 🎾" |
| Partie créée | "Ta partie a été publiée !" |
| Demande envoyée | "Demande envoyée ! Tu seras notifié." |
| Demande acceptée | "C'est bon, tu es dans la partie !" |
| Demande refusée | "Désolé, ta demande n'a pas été acceptée." |
| Partie complète | "La partie est complète ! Rendez-vous sur le terrain." |
| Match terminé | "Comment s'est passé le match ?" |
| Évaluation envoyée | "Merci pour ton retour !" |
| Erreur générique | "Oups, quelque chose s'est mal passé. Réessaie." |
| Pas de résultat | "Aucune partie trouvée. Crée la tienne !" |
| Pas de connexion | "Vérifie ta connexion internet." |
| Liste vide (matchs) | "Pas encore de match. Lance-toi !" |
| Liste vide (favoris) | "Aucun favori pour le moment." |

### 5.5 Notifications push
| Type | Titre | Corps |
|------|-------|-------|
| Partie suggérée | "Partie de padel près de toi 🏸" | "Demain à 18h, 3 joueurs de ton niveau cherchent un 4e." |
| Demande reçue | "Nouvelle demande !" | "Julien veut rejoindre ta partie de tennis." |
| Demande acceptée | "Tu es dans la partie ! 🎉" | "RDV mercredi 18h au Padel Club Aix." |
| Demande refusée | "Demande non retenue" | "Pas de chance cette fois, d'autres parties t'attendent !" |
| Partie complète | "Partie complète !" | "Tous les joueurs sont là. On se retrouve sur le terrain !" |
| Rappel | "C'est bientôt l'heure ! ⏰" | "Ta partie de padel commence dans 1h." |
| Post-match | "Comment c'était ? 🎾" | "Donne ton avis sur le match d'aujourd'hui." |

---

## 6. Responsive & Adaptations

### 6.1 Mobile (app native)
- Design principal. Toutes les fonctionnalités joueur.
- Tab bar fixe en bas.
- Safe area respectée (notch iPhone, barre Android).
- Animations fluides (React Native Reanimated).
- Haptic feedback sur les actions clés (accepter, refuser).

### 6.2 Dashboard Club (web responsive)
- Design desktop-first, responsive tablette.
- Sidebar de navigation à gauche (fond primary-dark).
- Contenu centré, max-width 1200px.
- Graphiques avec Recharts.
- Tables avec tri et filtres.

### 6.3 Back-office Admin (web)
- Design desktop.
- Sidebar + header.
- CRUD complet (users, clubs, parties, signalements).
- Logs et monitoring.

---

## 7. Accessibilité

### 7.1 Standards
- WCAG 2.1 AA minimum.
- Contraste texte/fond ≥ 4.5:1.
- Zones tactiles ≥ 48px.
- Labels accessibles sur tous les inputs et boutons.
- Support VoiceOver (iOS) et TalkBack (Android).

### 7.2 Handisport
- Filtre "Handisport" dans le profil et la recherche.
- Icône ♿ sur les parties accessibles.
- Badge "Club handisport friendly" dans l'annuaire.
- Pas de stigmatisation : l'option est discrète et opt-in.

---

## 8. Animations & Micro-interactions

| Interaction | Animation |
|-------------|-----------|
| Ouverture carte de match | Fade in + slide up (200ms) |
| Accepter une demande | Check vert + confetti léger |
| Refuser une demande | Fade out doux |
| Pull to refresh | Spinner primary rotation |
| Badge "Recommandé" | Subtle pulse (3s loop) |
| Transition entre onglets | Cross-fade (150ms) |
| Bottom sheet | Spring animation (natural feel) |
| Skeleton loading | Pulse gradient (neutral-100 → neutral-200) |
| Notification badge | Bounce in |
| Swipe to dismiss | Slide out + opacity 0 |

---

## 9. Iconographie

Utiliser **Lucide React Native** pour la cohérence.

| Fonction | Icône Lucide |
|----------|-------------|
| Accueil | `Home` |
| Rechercher | `Search` |
| Créer | `Plus` ou `PlusCircle` |
| Mes matchs | `Calendar` |
| Profil | `User` |
| Tennis | `Circle` (balle) ou icône custom |
| Padel | icône custom (raquette padel) |
| Squash | icône custom (raquette squash) |
| Lieu | `MapPin` |
| Heure | `Clock` |
| Joueurs | `Users` |
| Niveau | `BarChart2` |
| Favoris | `Heart` |
| Notification | `Bell` |
| Paramètres | `Settings` |
| Partager | `Share2` |
| Retour | `ChevronLeft` |
| Fermer | `X` |
| Filtre | `SlidersHorizontal` |
| Distance | `Navigation` |
| Handisport | `Accessibility` (ou ♿ custom) |
