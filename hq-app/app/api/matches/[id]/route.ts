import { prisma } from "@/lib/db";
import { apiError, deriveMatchStatus } from "@/lib/utils";
import type { MatchSlot, MatchStatus, UpdateMatchBody } from "@/types";

function isValidSlot(value: unknown): value is MatchSlot {
  return value === "teamAId" || value === "teamBId";
}

function isKnockoutPhase(phase: string | null | undefined) {
  return (
    phase === "round_of_32" ||
    phase === "round_of_16" ||
    phase === "quarter_final" ||
    phase === "semi_final" ||
    phase === "final"
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);

    const match = await prisma.match.findUnique({
      where: { id },
      include: { teamA: true, teamB: true, tournament: true, group: true },
    });

    if (!match) return apiError("Match not found", 404);
    return Response.json(match);
  } catch {
    return apiError("Failed to fetch match", 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchId = Number(id);

    if (!Number.isInteger(matchId) || matchId < 1) {
      return apiError("Invalid match id", 400);
    }

    const body: UpdateMatchBody = await req.json();

    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    if (!existingMatch) {
      return Response.json({ error: "Match not found" }, { status: 404 });
    }

    const nextTeamAId =
      body.teamAId !== undefined ? body.teamAId : existingMatch.teamAId;
    const nextTeamBId =
      body.teamBId !== undefined ? body.teamBId : existingMatch.teamBId;

    if (
      nextTeamAId != null &&
      nextTeamBId != null &&
      nextTeamAId === nextTeamBId
    ) {
      return apiError("A team cannot play against itself", 400);
    }

    if (body.round != null && body.round < 1) {
      return apiError("Round must be at least 1", 400);
    }

    if (body.bracketOrder != null && body.bracketOrder < 1) {
      return apiError("bracketOrder must be at least 1", 400);
    }

    if (body.nextMatchOrder != null && body.nextMatchOrder < 1) {
      return apiError("nextMatchOrder must be at least 1", 400);
    }

    const nextGroupId =
      body.groupId !== undefined ? body.groupId : existingMatch.groupId;
    const nextPhase = body.phase ?? existingMatch.phase;
    const requiresGroupId = existingMatch.tournament.type === "group_and_bracket";

    if (requiresGroupId && nextPhase === "group" && nextGroupId == null) {
      return apiError('groupId is required when phase is "group"', 400);
    }

    if (nextGroupId != null) {
      const group = await prisma.tournamentGroup.findUnique({
        where: { id: nextGroupId },
      });

      if (!group) {
        return apiError("Group not found", 404);
      }

      if (group.tournamentId !== existingMatch.tournamentId) {
        return apiError("Group does not belong to this tournament", 400);
      }
    }

    if (
      body.nextSlot !== undefined &&
      body.nextSlot !== null &&
      !isValidSlot(body.nextSlot)
    ) {
      return apiError('nextSlot must be "teamAId" or "teamBId"', 400);
    }

    if (
      body.loserNextSlot !== undefined &&
      body.loserNextSlot !== null &&
      !isValidSlot(body.loserNextSlot)
    ) {
      return apiError('loserNextSlot must be "teamAId" or "teamBId"', 400);
    }

    if (body.nextMatchId === matchId || body.loserNextMatchId === matchId) {
      return apiError("A match cannot point to itself", 400);
    }

    if (body.nextMatchId != null) {
      const nextMatch = await prisma.match.findUnique({
        where: { id: body.nextMatchId },
        select: { id: true, tournamentId: true },
      });

      if (!nextMatch) {
        return apiError("nextMatch not found", 404);
      }

      if (nextMatch.tournamentId !== existingMatch.tournamentId) {
        return apiError("nextMatch must belong to the same tournament", 400);
      }
    }

    if (body.loserNextMatchId != null) {
      const loserNextMatch = await prisma.match.findUnique({
        where: { id: body.loserNextMatchId },
        select: { id: true, tournamentId: true },
      });

      if (!loserNextMatch) {
        return apiError("loserNextMatch not found", 404);
      }

      if (loserNextMatch.tournamentId !== existingMatch.tournamentId) {
        return apiError("loserNextMatch must belong to the same tournament", 400);
      }
    }

    if (body.nextMatchId != null && body.nextSlot == null) {
      return apiError("nextSlot is required when nextMatchId is set", 400);
    }

    if (body.loserNextMatchId != null && body.loserNextSlot == null) {
      return apiError("loserNextSlot is required when loserNextMatchId is set", 400);
    }

    const nextScoreA =
      body.scoreA !== undefined ? body.scoreA : existingMatch.scoreA;
    const nextScoreB =
      body.scoreB !== undefined ? body.scoreB : existingMatch.scoreB;

    const derivedStatus: MatchStatus =
      body.status ?? deriveMatchStatus(nextScoreA ?? undefined, nextScoreB ?? undefined);

    const updatedMatches = await prisma.$transaction(async (tx) => {
      const affectedIds = new Set<number>([matchId]);

      const match = await tx.match.update({
        where: { id: matchId },
        data: {
          ...(body.teamAId !== undefined && { teamAId: body.teamAId }),
          ...(body.teamBId !== undefined && { teamBId: body.teamBId }),
          ...(body.scoreA !== undefined && { scoreA: body.scoreA }),
          ...(body.scoreB !== undefined && { scoreB: body.scoreB }),
          ...(body.bodyCountA !== undefined && { bodyCountA: body.bodyCountA }),
          ...(body.bodyCountB !== undefined && { bodyCountB: body.bodyCountB }),
          ...(body.round !== undefined && { round: body.round }),
          ...(body.phase !== undefined && { phase: body.phase }),
          ...(body.groupId !== undefined && { groupId: body.groupId }),
          ...(body.label !== undefined && { label: body.label?.trim() || null }),
          ...(body.field !== undefined && { field: body.field?.trim() || null }),
          ...(body.nextMatchId !== undefined && { nextMatchId: body.nextMatchId }),
          ...(body.nextSlot !== undefined && { nextSlot: body.nextSlot }),
          ...(body.loserNextMatchId !== undefined && {
            loserNextMatchId: body.loserNextMatchId,
          }),
          ...(body.loserNextSlot !== undefined && {
            loserNextSlot: body.loserNextSlot,
          }),
          ...(body.bracketOrder !== undefined && {
            bracketOrder: body.bracketOrder,
          }),
          ...(body.nextMatchOrder !== undefined && {
            nextMatchOrder: body.nextMatchOrder,
          }),
          ...(body.manualOverride !== undefined && {
            manualOverride: body.manualOverride,
          }),
          status: derivedStatus,
        },
        include: { teamA: true, teamB: true, group: true },
      });

      if (
        isKnockoutPhase(match.phase) &&
        match.scoreA != null &&
        match.scoreB != null &&
        match.teamAId != null &&
        match.teamBId != null &&
        match.scoreA !== match.scoreB &&
        match.phase !== "final"
      ) {
        const winnerId = match.scoreA > match.scoreB ? match.teamAId : match.teamBId;
        const loserId = match.scoreA > match.scoreB ? match.teamBId : match.teamAId;

        if (match.nextMatchId && match.nextSlot) {
          await tx.match.update({
            where: { id: match.nextMatchId },
            data: {
              [match.nextSlot]: winnerId,
            },
          });
          affectedIds.add(match.nextMatchId);
        }

        if (match.loserNextMatchId && match.loserNextSlot) {
          await tx.match.update({
            where: { id: match.loserNextMatchId },
            data: {
              [match.loserNextSlot]: loserId,
            },
          });
          affectedIds.add(match.loserNextMatchId);
        }
      }

      return tx.match.findMany({
        where: {
          id: { in: Array.from(affectedIds) },
        },
        include: {
          teamA: true,
          teamB: true,
          group: true,
        },
      });
    });

    return Response.json({ updatedMatches });
  } catch (error) {
    console.error("Error updating match:", error);
    return Response.json({ error: "Failed to update match" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);

    if (!Number.isInteger(id) || id < 1) {
      return apiError("Invalid match id", 400);
    }

    await prisma.match.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return apiError("Failed to delete match", 500);
  }
}