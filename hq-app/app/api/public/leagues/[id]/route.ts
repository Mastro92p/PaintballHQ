import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";

async function ensureManualStandingTablesForLeague(leagueId: number) {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      tournaments: {
        where: {
          isHidden: false,
        },
        include: {
          division: true,
        },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!league) return null;

  const tournamentsByDivision = new Map<
    number,
    {
      divisionId: number;
      tournaments: Array<{
        id: number;
        name: string;
        date: string;
        divisionId: number | null;
      }>;
    }
  >();

  for (const tournament of league.tournaments) {
    if (!tournament.divisionId) continue;

    if (!tournamentsByDivision.has(tournament.divisionId)) {
      tournamentsByDivision.set(tournament.divisionId, {
        divisionId: tournament.divisionId,
        tournaments: [],
      });
    }

    tournamentsByDivision.get(tournament.divisionId)!.tournaments.push({
      id: tournament.id,
      name: tournament.name,
      date: tournament.date,
      divisionId: tournament.divisionId,
    });
  }

  for (const { divisionId, tournaments } of tournamentsByDivision.values()) {
    let table = await prisma.leagueManualStandingTable.findFirst({
      where: {
        leagueId,
        divisionId,
      },
    });

    if (!table) {
      table = await prisma.leagueManualStandingTable.create({
        data: {
          leagueId,
          divisionId,
        },
      });
    }

    const existingDays = await prisma.leagueManualStandingDay.findMany({
      where: { tableId: table.id },
      orderBy: { sortOrder: "asc" },
    });

    const existingByTournamentId = new Map<number, (typeof existingDays)[number]>();

    for (const day of existingDays) {
      existingByTournamentId.set(day.tournamentId, day);
    }

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
        await prisma.leagueManualStandingDay.update({
          where: { id: existingDay.id },
          data: {
            tournamentId: tournament.id,
            label: tournament.name,
            date: tournament.date,
            sortOrder,
          },
        });
      }
    }

    const tournamentIds = new Set(tournaments.map((t) => t.id));
    const staleDays = existingDays.filter((day) => !tournamentIds.has(day.tournamentId));

    if (staleDays.length > 0) {
      await prisma.leagueManualStandingDay.deleteMany({
        where: {
          id: {
            in: staleDays.map((d) => d.id),
          },
        },
      });
    }
  }

  return true;
}

async function getPublicLeagueDetail(id: number) {
  return prisma.league.findFirst({
    where: {
      id,
      isHidden: false,
    },
    include: {
      tournaments: {
        where: {
          isHidden: false,
        },
        include: {
          division: true,
          teams: {
            include: {
              team: {
                include: {
                  division: true,
                },
              },
            },
          },
          matches: true,
        },
        orderBy: { date: "desc" },
      },
      teams: {
        include: {
          team: {
            include: {
              division: true,
            },
          },
        },
      },
      manualStandingTables: {
        include: {
          division: true,
          days: {
            include: {
              tournament: true,
              scores: {
                include: {
                  team: true,
                },
                orderBy: {
                  teamId: "asc",
                },
              },
            },
            orderBy: [{ sortOrder: "asc" }, { date: "asc" }],
          },
        },
        orderBy: {
          divisionId: "asc",
        },
      },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);

    if (Number.isNaN(id)) {
      return apiError("Invalid league id", 400);
    }

    const existingLeague = await prisma.league.findFirst({
      where: {
        id,
        isHidden: false,
      },
      select: { id: true },
    });

    if (!existingLeague) {
      return apiError("League not found", 404);
    }

    await ensureManualStandingTablesForLeague(id);

    const league = await getPublicLeagueDetail(id);

    if (!league) {
      return apiError("League not found", 404);
    }

    return Response.json(league);
  } catch {
    return apiError("Failed to fetch league", 500);
  }
}