import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  const tournaments = await prisma.tournament.findMany({
    include: {
      matches: {
        select: {
          id: true,
          groupLegacy: true,
          groupId: true,
        },
      },
      teams: {
        select: {
          tournamentId: true,
          teamId: true,
          groups: true,
        },
      },
      groups: {
        select: {
          id: true,
          name: true,
          order: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  for (const tournament of tournaments) {
    const legacyNames = new Set<string>();

    for (const match of tournament.matches) {
      const name = match.groupLegacy?.trim();
      if (name) legacyNames.add(name);
    }

    for (const team of tournament.teams) {
      for (const name of team.groups ?? []) {
        const trimmed = name?.trim();
        if (trimmed) legacyNames.add(trimmed);
      }
    }

    const existingByName = new Map(
      tournament.groups.map((g) => [g.name, g])
    );

    let nextOrder =
      tournament.groups.length > 0
        ? Math.max(...tournament.groups.map((g) => g.order)) + 1
        : 0;

    for (const name of legacyNames) {
      if (!existingByName.has(name)) {
        const created = await prisma.tournamentGroup.create({
          data: {
            tournamentId: tournament.id,
            name,
            order: nextOrder++,
          },
        });
        existingByName.set(name, created);
      }
    }

    for (const match of tournament.matches) {
      if (match.groupId || !match.groupLegacy?.trim()) continue;

      const group = existingByName.get(match.groupLegacy.trim());
      if (!group) continue;

      await prisma.match.update({
        where: { id: match.id },
        data: { groupId: group.id },
      });
    }

    for (const team of tournament.teams) {
      for (const rawName of team.groups ?? []) {
        const name = rawName?.trim();
        if (!name) continue;

        const group = existingByName.get(name);
        if (!group) continue;

        await prisma.tournamentTeamGroup.upsert({
          where: {
            tournamentId_teamId_groupId: {
              tournamentId: team.tournamentId,
              teamId: team.teamId,
              groupId: group.id,
            },
          },
          update: {},
          create: {
            tournamentId: team.tournamentId,
            teamId: team.teamId,
            groupId: group.id,
          },
        });
      }
    }
  }

  console.log("Tournament groups backfill completed.");
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });