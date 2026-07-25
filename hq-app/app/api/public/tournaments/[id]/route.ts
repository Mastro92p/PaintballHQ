import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);

    if (Number.isNaN(id)) {
      return apiError("Invalid tournament id", 400);
    }

    const tournament = await prisma.tournament.findFirst({
        where: {
        id, // only in [id]
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
      include: {
        division: true,
        groups: {
          orderBy: [{ order: "asc" }, { id: "asc" }],
        },
        brackets: {
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
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
        matches: {
          include: {
            teamA: true,
            teamB: true,
            group: true,
            bracket: true,
          },
          orderBy: [{ round: "asc" }, { id: "asc" }],
        },
      },
    });

    if (!tournament) {
      return apiError("Tournament not found", 404);
    }

    return Response.json(tournament);
  } catch {
    return apiError("Failed to fetch tournament", 500);
  }
}