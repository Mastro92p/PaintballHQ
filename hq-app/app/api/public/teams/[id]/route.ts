import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const teamId = Number(id);

    if (Number.isNaN(teamId)) {
      return Response.json({ error: "Invalid team id" }, { status: 400 });
    }

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { divisionId: null },
          { division: { isActive: true } },
        ],
      },
      include: {
        division: true,
        tournaments: { include: { tournament: true } },
        matchesA: { include: { teamB: true, tournament: true } },
        matchesB: { include: { teamA: true, tournament: true } },
      },
    });

    if (!team) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    const allMatches = [...team.matchesA, ...team.matchesB];
    const completedMatches = allMatches.filter((m) => m.status === "completed");

    const wins = completedMatches.filter(
      (m) =>
        (m.teamAId === team.id && (m.scoreA ?? 0) > (m.scoreB ?? 0)) ||
        (m.teamBId === team.id && (m.scoreB ?? 0) > (m.scoreA ?? 0))
    ).length;

    const enrichedTeam = {
      ...team,
      tournamentCount: team.tournaments.length,
      totalMatches: completedMatches.length,
      wins,
    };

    return Response.json(enrichedTeam);
  } catch (error) {
    console.error(`GET /api/public/teams/[id] failed:`, error);
    return Response.json(
      {
        error: "Failed to fetch public team",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}