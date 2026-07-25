import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";

export async function GET() {
  try {
    const leagues = await prisma.league.findMany({
      where: {
        isHidden: false,
      },
      orderBy: { createdAt: "desc" },
      include: {
        tournaments: {
          where: {
            isHidden: false,
          },
          orderBy: { date: "desc" },
        },
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    return Response.json(leagues);
  } catch {
    return apiError("Failed to fetch leagues", 500);
  }
}