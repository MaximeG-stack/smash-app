import { PrismaClient, Sport, PlayerLevel, UserRole, ClubSubscription, CourtSurface } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Démarrage du seed SMASHI...");

  // Clubs pilotes PACA
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

  // Terrains
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

  console.log("Seed terminé avec succès.");
  console.log(`- ${2} clubs créés`);
  console.log(`- ${3} terrains créés`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
