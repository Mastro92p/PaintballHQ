import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
        where: {
        isHidden: false,
        OR: [
            { leagueId: null },
            {
            league: {
                is: {
                isHidden: false,
                },
            },
            },
        ],
        },
      orderBy: [
        { startDateTime: { sort: 'desc', nulls: 'last' } },
        { date: 'desc' },
      ],
      include: {
        teams: {
          include: {
            team: true,
            groupLinks: {
              include: {
                group: true,
              },
            },
          },
        },
        groups: {
          orderBy: [{ order: "asc" }, { id: "asc" }],
        },
        brackets: {
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
        matches: {
          include: {
            teamA: true,
            teamB: true,
            group: true,
            bracket: true,
          },
          orderBy: [{ round: "asc" }, { id: "asc" }],
        },
        division: true,
      },
    });

    return Response.json(tournaments);
  } catch {
    return apiError("Failed to fetch tournaments", 500);
  }
}