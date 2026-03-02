import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { PrismaClient, Sport, PlayerLevel, UserRole, ClubSubscription, CourtSurface, MatchStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Coordonnées PACA
const CITIES = {
  Marseille:       { latitude: 43.2965, longitude: 5.3698 },
  "Aix-en-Provence": { latitude: 43.5297, longitude: 5.4474 },
  Toulon:          { latitude: 43.1242, longitude: 5.9280 },
  Nice:            { latitude: 43.7102, longitude: 7.2620 },
};

// Date helper : dans N jours à H:MM
function futureDateAt(daysFromNow: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Démarrage du seed SMASHI...");

  // ─── Clubs ───────────────────────────────────────────────────────────────

  const clubPadelMarseille = await prisma.club.upsert({
    where: { id: "club-padel-marseille-1" },
    update: {},
    create: {
      id: "club-padel-marseille-1",
      name: "Padel Marseille Sud",
      description: "Le premier club de padel au cœur du 8e arrondissement.",
      address: "12 avenue du Prado",
      city: "Marseille",
      postalCode: "13008",
      latitude: 43.2804,
      longitude: 5.3763,
      phone: "04 91 00 00 01",
      email: "contact@padel-marseille-sud.fr",
      sports: [Sport.PADEL, Sport.TENNIS],
      isHandisportFriendly: true,
      subscription: ClubSubscription.STANDARD,
    },
  });

  const clubTennisAix = await prisma.club.upsert({
    where: { id: "club-tennis-aix-1" },
    update: {},
    create: {
      id: "club-tennis-aix-1",
      name: "Tennis Club Aix-en-Provence",
      description: "Club historique d'Aix, 20 terrains terre battue.",
      address: "Rue des Allumettes",
      city: "Aix-en-Provence",
      postalCode: "13100",
      latitude: 43.5297,
      longitude: 5.4474,
      sports: [Sport.TENNIS, Sport.PADEL],
      subscription: ClubSubscription.PREMIUM,
    },
  });

  // ─── Courts ──────────────────────────────────────────────────────────────

  await prisma.court.createMany({
    data: [
      {
        clubId: clubPadelMarseille.id,
        name: "Padel 1",
        sport: Sport.PADEL,
        surface: CourtSurface.SYNTHETIC,
        isIndoor: true,
        isLighted: true,
      },
      {
        clubId: clubPadelMarseille.id,
        name: "Padel 2",
        sport: Sport.PADEL,
        surface: CourtSurface.SYNTHETIC,
        isIndoor: false,
        isLighted: true,
      },
      {
        clubId: clubTennisAix.id,
        name: "Court A",
        sport: Sport.TENNIS,
        surface: CourtSurface.CLAY,
        isIndoor: false,
        isLighted: false,
      },
    ],
    skipDuplicates: true,
  });

  // ─── Utilisateurs fictifs ─────────────────────────────────────────────────

  const u1 = await prisma.user.upsert({
    where: { email: "thomas.dupont@seed.smashi.fr" },
    update: {},
    create: {
      id: "seed-user-1",
      email: "thomas.dupont@seed.smashi.fr",
      firebaseUid: "seed-firebase-uid-1",
      firstName: "Thomas",
      lastName: "Dupont",
      role: UserRole.PLAYER,
      profile: {
        create: {
          primarySport: Sport.TENNIS,
          sports: [Sport.TENNIS, Sport.PADEL],
          level: PlayerLevel.INTERMEDIATE,
          city: "Marseille",
          postalCode: "13008",
          latitude: CITIES.Marseille.latitude,
          longitude: CITIES.Marseille.longitude,
          searchRadius: 20,
          bio: "Amateur de tennis depuis 10 ans, classé 30/1.",
        },
      },
    },
  });

  const u2 = await prisma.user.upsert({
    where: { email: "sophie.martin@seed.smashi.fr" },
    update: {},
    create: {
      id: "seed-user-2",
      email: "sophie.martin@seed.smashi.fr",
      firebaseUid: "seed-firebase-uid-2",
      firstName: "Sophie",
      lastName: "Martin",
      role: UserRole.PLAYER,
      profile: {
        create: {
          primarySport: Sport.PADEL,
          sports: [Sport.PADEL],
          level: PlayerLevel.ADVANCED,
          city: "Aix-en-Provence",
          postalCode: "13100",
          latitude: CITIES["Aix-en-Provence"].latitude,
          longitude: CITIES["Aix-en-Provence"].longitude,
          searchRadius: 30,
          bio: "Joueuse de padel compétition, P250.",
        },
      },
    },
  });

  const u3 = await prisma.user.upsert({
    where: { email: "lucas.bernard@seed.smashi.fr" },
    update: {},
    create: {
      id: "seed-user-3",
      email: "lucas.bernard@seed.smashi.fr",
      firebaseUid: "seed-firebase-uid-3",
      firstName: "Lucas",
      lastName: "Bernard",
      role: UserRole.PLAYER,
      profile: {
        create: {
          primarySport: Sport.SQUASH,
          sports: [Sport.SQUASH, Sport.PADEL],
          level: PlayerLevel.BEGINNER,
          city: "Toulon",
          postalCode: "83000",
          latitude: CITIES.Toulon.latitude,
          longitude: CITIES.Toulon.longitude,
          searchRadius: 25,
          bio: "Débutant passionné, disponible le week-end.",
        },
      },
    },
  });

  const u4 = await prisma.user.upsert({
    where: { email: "emma.petit@seed.smashi.fr" },
    update: {},
    create: {
      id: "seed-user-4",
      email: "emma.petit@seed.smashi.fr",
      firebaseUid: "seed-firebase-uid-4",
      firstName: "Emma",
      lastName: "Petit",
      role: UserRole.PLAYER,
      profile: {
        create: {
          primarySport: Sport.PADEL,
          sports: [Sport.PADEL, Sport.TENNIS],
          level: PlayerLevel.INTERMEDIATE,
          city: "Nice",
          postalCode: "06000",
          latitude: CITIES.Nice.latitude,
          longitude: CITIES.Nice.longitude,
          searchRadius: 20,
          bio: "Passionnée de padel, joue 3x par semaine.",
        },
      },
    },
  });

  console.log("4 utilisateurs fictifs créés.");

  // ─── Parties ──────────────────────────────────────────────────────────────
  // Supprime les parties seed précédentes pour éviter les doublons
  await prisma.match.deleteMany({
    where: { id: { startsWith: "seed-match-" } },
  });

  const matchesData = [
    // ── PADEL ──
    {
      id: "seed-match-1",
      creatorId: u1.id,
      sport: Sport.PADEL,
      title: "Padel débutants Marseille",
      description: "Venez découvrir le padel dans une ambiance conviviale ! Tous niveaux bienvenus.",
      locationName: "Padel Marseille Sud — Prado",
      ...CITIES.Marseille,
      scheduledAt: futureDateAt(1, 10),
      durationMinutes: 90,
      requiredLevel: PlayerLevel.BEGINNER,
      maxPlayers: 4,
      currentPlayers: 1,
      status: MatchStatus.OPEN,
    },
    {
      id: "seed-match-2",
      creatorId: u2.id,
      sport: Sport.PADEL,
      title: "Padel intermédiaire Aix",
      description: "Recherche 3 joueurs niveau intermédiaire pour une session technique.",
      locationName: "Tennis Club Aix — Terrain padel",
      ...CITIES["Aix-en-Provence"],
      scheduledAt: futureDateAt(1, 14, 30),
      durationMinutes: 90,
      requiredLevel: PlayerLevel.INTERMEDIATE,
      maxPlayers: 4,
      currentPlayers: 1,
      status: MatchStatus.OPEN,
    },
    {
      id: "seed-match-3",
      creatorId: u2.id,
      sport: Sport.PADEL,
      title: "Padel compétitif Marseille",
      description: "Match intense pour joueurs avancés. Ambiance sérieuse.",
      locationName: "Padel Arena Marseille 8e",
      ...CITIES.Marseille,
      scheduledAt: futureDateAt(2, 9),
      durationMinutes: 90,
      requiredLevel: PlayerLevel.ADVANCED,
      maxPlayers: 4,
      currentPlayers: 2,
      status: MatchStatus.OPEN,
    },
    {
      id: "seed-match-4",
      creatorId: u4.id,
      sport: Sport.PADEL,
      title: "Padel fun à Nice",
      description: "Session détendue en bord de mer, puis apéro si vous êtes partants !",
      locationName: "Padel Nice Côte d'Azur",
      ...CITIES.Nice,
      scheduledAt: futureDateAt(2, 16),
      durationMinutes: 90,
      requiredLevel: null,
      maxPlayers: 4,
      currentPlayers: 1,
      status: MatchStatus.OPEN,
    },
    {
      id: "seed-match-5",
      creatorId: u3.id,
      sport: Sport.PADEL,
      title: "Padel découverte Toulon",
      description: "Je débute au padel, cherche des partenaires de même niveau pour progresser ensemble.",
      locationName: "Club de Padel Toulon Centre",
      ...CITIES.Toulon,
      scheduledAt: futureDateAt(3, 11),
      durationMinutes: 60,
      requiredLevel: PlayerLevel.BEGINNER,
      maxPlayers: 4,
      currentPlayers: 1,
      status: MatchStatus.OPEN,
    },
    {
      id: "seed-match-6",
      creatorId: u4.id,
      sport: Sport.PADEL,
      title: "4 joueurs padel Nice",
      description: "Partie mixte, bonne humeur obligatoire.",
      locationName: "Padel Club Côte d'Azur",
      ...CITIES.Nice,
      scheduledAt: futureDateAt(5, 10),
      durationMinutes: 90,
      requiredLevel: PlayerLevel.INTERMEDIATE,
      maxPlayers: 4,
      currentPlayers: 4, // FULL
      status: MatchStatus.FULL,
    },

    // ── TENNIS ──
    {
      id: "seed-match-7",
      creatorId: u1.id,
      sport: Sport.TENNIS,
      title: "Tennis classé Marseille",
      description: "Cherche adversaire de niveau équivalent pour un match en 2 sets.",
      locationName: "Tennis Club du Prado — Marseille",
      ...CITIES.Marseille,
      scheduledAt: futureDateAt(1, 18),
      durationMinutes: 60,
      requiredLevel: PlayerLevel.INTERMEDIATE,
      maxPlayers: 2,
      currentPlayers: 1,
      status: MatchStatus.OPEN,
    },
    {
      id: "seed-match-8",
      creatorId: u4.id,
      sport: Sport.TENNIS,
      title: "Tennis débutant Nice",
      description: "Partie tranquille pour progresser, coach amateur disponible.",
      locationName: "Lawn Tennis Club de Nice",
      ...CITIES.Nice,
      scheduledAt: futureDateAt(3, 9, 30),
      durationMinutes: 60,
      requiredLevel: PlayerLevel.BEGINNER,
      maxPlayers: 2,
      currentPlayers: 1,
      status: MatchStatus.OPEN,
    },
    {
      id: "seed-match-9",
      creatorId: u1.id,
      sport: Sport.TENNIS,
      title: "Tennis compétitif Aix",
      description: "Match aller-retour, classement 30/2 ou similaire.",
      locationName: "Tennis Club Aix-en-Provence",
      ...CITIES["Aix-en-Provence"],
      scheduledAt: futureDateAt(4, 17),
      durationMinutes: 90,
      requiredLevel: PlayerLevel.ADVANCED,
      maxPlayers: 2,
      currentPlayers: 2, // FULL — u1 + u2
      status: MatchStatus.FULL,
    },
    {
      id: "seed-match-10",
      creatorId: u2.id,
      sport: Sport.TENNIS,
      title: "Tennis double mixte Aix",
      description: "Double mixte convivial, venez à 2 ou rejoignez en solo.",
      locationName: "Tennis Club des Allumettes — Aix",
      ...CITIES["Aix-en-Provence"],
      scheduledAt: futureDateAt(6, 10, 30),
      durationMinutes: 90,
      requiredLevel: PlayerLevel.INTERMEDIATE,
      maxPlayers: 4,
      currentPlayers: 1,
      status: MatchStatus.OPEN,
    },

    // ── SQUASH ──
    {
      id: "seed-match-11",
      creatorId: u3.id,
      sport: Sport.SQUASH,
      title: "Squash débutant Toulon",
      description: "Première fois au squash ? Moi aussi ! Progressons ensemble.",
      locationName: "Squash Club Toulon Liberté",
      ...CITIES.Toulon,
      scheduledAt: futureDateAt(2, 12),
      durationMinutes: 60,
      requiredLevel: PlayerLevel.BEGINNER,
      maxPlayers: 2,
      currentPlayers: 1,
      status: MatchStatus.OPEN,
    },
    {
      id: "seed-match-12",
      creatorId: u1.id,
      sport: Sport.SQUASH,
      title: "Squash rapide Marseille",
      description: "Match en 30 min chrono, pause dej ou after work.",
      locationName: "Royal Squash Club Marseille",
      ...CITIES.Marseille,
      scheduledAt: futureDateAt(3, 13),
      durationMinutes: 60,
      requiredLevel: PlayerLevel.INTERMEDIATE,
      maxPlayers: 2,
      currentPlayers: 1,
      status: MatchStatus.OPEN,
    },
    {
      id: "seed-match-13",
      creatorId: u3.id,
      sport: Sport.SQUASH,
      title: "Squash intermédiaire Toulon",
      description: "Pour les joueurs réguliers, 3 sets minimum.",
      locationName: "Squash Club Toulon Liberté",
      ...CITIES.Toulon,
      scheduledAt: futureDateAt(5, 18, 30),
      durationMinutes: 90,
      requiredLevel: PlayerLevel.INTERMEDIATE,
      maxPlayers: 2,
      currentPlayers: 2, // FULL
      status: MatchStatus.FULL,
    },
    {
      id: "seed-match-14",
      creatorId: u4.id,
      sport: Sport.SQUASH,
      title: "Squash Nice — tous niveaux",
      description: "Nouvelle salle à Nice, inaugurons-la ensemble !",
      locationName: "Squash Côte d'Azur Nice",
      ...CITIES.Nice,
      scheduledAt: futureDateAt(7, 15),
      durationMinutes: 60,
      requiredLevel: null,
      maxPlayers: 2,
      currentPlayers: 1,
      status: MatchStatus.OPEN,
    },
  ];

  for (const data of matchesData) {
    await prisma.match.create({ data });
  }

  console.log(`${matchesData.length} parties créées.`);

  // ─── MatchPlayers (créateurs + joueurs FULL) ──────────────────────────────

  const matchPlayerData = [
    // Chaque créateur est automatiquement inscrit
    { matchId: "seed-match-1",  userId: u1.id },
    { matchId: "seed-match-2",  userId: u2.id },
    { matchId: "seed-match-3",  userId: u2.id },
    { matchId: "seed-match-4",  userId: u4.id },
    { matchId: "seed-match-5",  userId: u3.id },
    // seed-match-6 FULL : u4 + u1 + u2 + u3
    { matchId: "seed-match-6",  userId: u4.id },
    { matchId: "seed-match-6",  userId: u1.id },
    { matchId: "seed-match-6",  userId: u2.id },
    { matchId: "seed-match-6",  userId: u3.id },
    { matchId: "seed-match-7",  userId: u1.id },
    { matchId: "seed-match-8",  userId: u4.id },
    // seed-match-9 FULL : u1 + u2
    { matchId: "seed-match-9",  userId: u1.id },
    { matchId: "seed-match-9",  userId: u2.id },
    { matchId: "seed-match-10", userId: u2.id },
    { matchId: "seed-match-11", userId: u3.id },
    { matchId: "seed-match-12", userId: u1.id },
    // seed-match-13 FULL : u3 + u1
    { matchId: "seed-match-13", userId: u3.id },
    { matchId: "seed-match-13", userId: u1.id },
    { matchId: "seed-match-14", userId: u4.id },
  ];

  await prisma.matchPlayer.createMany({
    data: matchPlayerData,
    skipDuplicates: true,
  });

  console.log("Seed terminé avec succès ✓");
  console.log(`  → 2 clubs`);
  console.log(`  → 3 terrains`);
  console.log(`  → 4 utilisateurs fictifs`);
  console.log(`  → ${matchesData.length} parties (${matchesData.filter(m => m.status === MatchStatus.OPEN).length} ouvertes, ${matchesData.filter(m => m.status === MatchStatus.FULL).length} complètes)`);
  console.log();
  console.log("Comptes fictifs (pour info) :");
  console.log("  thomas.dupont@seed.smashi.fr  — Tennis INTERMEDIATE, Marseille");
  console.log("  sophie.martin@seed.smashi.fr  — Padel ADVANCED,      Aix-en-Provence");
  console.log("  lucas.bernard@seed.smashi.fr  — Squash BEGINNER,     Toulon");
  console.log("  emma.petit@seed.smashi.fr     — Padel INTERMEDIATE,  Nice");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
