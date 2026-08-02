import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";

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
          OR: [
            { divisionId: null },
            { division: { isActive: true } },
          ],
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
        where: {
          OR: [
            { team: { divisionId: null } },
            { team: { division: { isActive: true } } },
          ],
        },
        include: {
          team: {
            include: {
              division: true,
            },
          },
        },
      },
      manualStandingTables: {
        where: {
          division: {
            isActive: true,
          },
        },
        include: {
          division: true,
          days: {
            where: {
              tournament: {
                isHidden: false,
                division: {
                  isActive: true,
                },
              },
            },
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
        orderBy: [
          {
            division: {
              sortOrder: "asc",
            },
          },
          {
            division: {
              name: "asc",
            },
          },
        ],
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

    const league = await getPublicLeagueDetail(id);

    if (!league) {
      return apiError("League not found", 404);
    }

    return Response.json(league);
  } catch {
    return apiError("Failed to fetch league", 500);
  }
}