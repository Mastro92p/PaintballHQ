import { prisma } from "@/lib/db";

export async function ensureManualStandingTablesForLeague(leagueId: number) {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      tournaments: {
        where: {
          isHidden: false,
          division: {
            isActive: true,
          },
        },
        include: {
          division: true,
        },
        orderBy: [{ date: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!league) return null;

  const tournamentsByDivision = new Map<
    number,
    Array<{
      id: number;
      name: string;
      date: string;
      divisionId: number;
    }>
  >();

  for (const tournament of league.tournaments) {
    if (!tournament.divisionId) continue;

    if (!tournamentsByDivision.has(tournament.divisionId)) {
      tournamentsByDivision.set(tournament.divisionId, []);
    }

    tournamentsByDivision.get(tournament.divisionId)!.push({
      id: tournament.id,
      name: tournament.name,
      date: tournament.date,
      divisionId: tournament.divisionId,
    });
  }

  for (const [divisionId, tournaments] of tournamentsByDivision.entries()) {
    const table = await prisma.leagueManualStandingTable.upsert({
      where: {
        leagueId_divisionId: {
          leagueId,
          divisionId,
        },
      },
      update: {},
      create: {
        leagueId,
        divisionId,
      },
    });

    const existingDays = await prisma.leagueManualStandingDay.findMany({
      where: { tableId: table.id },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    const existingByTournamentId = new Map(
      existingDays.map((day) => [day.tournamentId, day])
    );

    for (let index = 0; index < tournaments.length; index++) {
      const tournament = tournaments[index];
      const sortOrder = index + 1;
      const existingDay = existingByTournamentId.get(tournament.id);

      if (!existingDay) {
        await prisma.leagueManualStandingDay.create({
          data: {
            tableId: table.id,
            tournamentId: tournament.id,
            label: tournament.name,
            date: tournament.date,
            sortOrder,
          },
        });
      } else {
        const needsUpdate =
          existingDay.label !== tournament.name ||
          existingDay.date !== tournament.date ||
          existingDay.sortOrder !== sortOrder;

        if (needsUpdate) {
          await prisma.leagueManualStandingDay.update({
            where: { id: existingDay.id },
            data: {
              label: tournament.name,
              date: tournament.date,
              sortOrder,
            },
          });
        }
      }
    }
  }

  return true;
}