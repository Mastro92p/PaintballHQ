import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";

type ManualStandingBulkUpdateItem = {
  dayId: number;
  teamId: number;
  score: number | null;
  eventRank: number | null;
};

type ManualStandingBulkUpdateInput = {
  leagueId?: number;
  updates: ManualStandingBulkUpdateItem[];
};

export async function PATCH(req: Request) {
  try {
    const body: ManualStandingBulkUpdateInput = await req.json();

    if (!Array.isArray(body.updates) || body.updates.length === 0) {
      return apiError("No updates provided", 400);
    }

    const updates = body.updates.map((item) => {
      const dayId = Number(item.dayId);
      const teamId = Number(item.teamId);

      const normalizedScore =
        item.score === null || item.score === undefined || item.score === ("" as never)
          ? null
          : Number(item.score);

      const normalizedEventRank =
        item.eventRank === null ||
        item.eventRank === undefined ||
        item.eventRank === ("" as never)
          ? null
          : Number(item.eventRank);

      return {
        dayId,
        teamId,
        score: normalizedScore,
        eventRank: normalizedEventRank,
      };
    });

    for (const item of updates) {
      if (Number.isNaN(item.dayId) || Number.isNaN(item.teamId)) {
        return apiError("Invalid dayId or teamId", 400);
      }

      if (item.score !== null && Number.isNaN(item.score)) {
        return apiError("Score must be a number or null", 400);
      }

      if (item.eventRank !== null && Number.isNaN(item.eventRank)) {
        return apiError("Event rank must be a number or null", 400);
      }
    }

    const uniqueDayIds = [...new Set(updates.map((item) => item.dayId))];
    const uniqueTeamIds = [...new Set(updates.map((item) => item.teamId))];

    const days = await prisma.leagueManualStandingDay.findMany({
      where: {
        id: { in: uniqueDayIds },
      },
      include: {
        table: {
          include: {
            league: true,
            division: true,
          },
        },
        tournament: true,
      },
    });

    const teams = await prisma.team.findMany({
      where: {
        id: { in: uniqueTeamIds },
      },
      select: {
        id: true,
        name: true,
        divisionId: true,
      },
    });

    const dayMap = new Map(days.map((day) => [day.id, day]));
    const teamMap = new Map(teams.map((team) => [team.id, team]));

    for (const item of updates) {
      const day = dayMap.get(item.dayId);
      if (!day) {
        return apiError(`Manual standings day not found: ${item.dayId}`, 404);
      }

      const team = teamMap.get(item.teamId);
      if (!team) {
        return apiError(`Team not found: ${item.teamId}`, 404);
      }

      if (team.divisionId !== day.table.divisionId) {
        return apiError("Team does not belong to this division table", 400);
      }
    }

    const leagueAssignments = await prisma.leagueTeam.findMany({
      where: {
        OR: updates.map((item) => {
          const day = dayMap.get(item.dayId)!;
          return {
            leagueId: day.table.leagueId,
            teamId: item.teamId,
          };
        }),
      },
      select: {
        leagueId: true,
        teamId: true,
      },
    });

    const assignmentSet = new Set(
      leagueAssignments.map((item) => `${item.leagueId}:${item.teamId}`)
    );

    for (const item of updates) {
      const day = dayMap.get(item.dayId)!;
      const assignmentKey = `${day.table.leagueId}:${item.teamId}`;
      if (!assignmentSet.has(assignmentKey)) {
        return apiError("Team is not assigned to this league", 400);
      }
    }

    const result = await prisma.$transaction(
      updates.map((item) =>
        prisma.leagueManualStandingScore.upsert({
          where: {
            dayId_teamId: {
              dayId: item.dayId,
              teamId: item.teamId,
            },
          },
          update: {
            score: item.score,
            eventRank: item.eventRank,
          },
          create: {
            dayId: item.dayId,
            teamId: item.teamId,
            score: item.score,
            eventRank: item.eventRank,
          },
        })
      )
    );

    return Response.json({
      success: true,
      updatedCount: result.length,
    });
  } catch {
    return apiError("Failed to save manual standing scores", 500);
  }
}