import { prisma } from "@/lib/db";
import { apiError, deriveMatchStatus } from "@/lib/utils";
import type {
  CreateMatchBody,
  MatchPhase,
  MatchSlot,
} from "@/types";

const BRACKET_PHASES: ReadonlySet<MatchPhase> = new Set([
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "final",
  "third_place",
]);

function isValidSlot(value: unknown): value is MatchSlot {
  return value === "teamAId" || value === "teamBId";
}

function isBracketPhase(phase: MatchPhase) {
  return BRACKET_PHASES.has(phase);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId");

    const where =
      tournamentId && Number.isInteger(Number(tournamentId))
        ? { tournamentId: parseInt(tournamentId, 10) }
        : undefined;

    const matches = await prisma.match.findMany({
      where,
      include: { teamA: true, teamB: true, group: true },
      orderBy: [{ round: "asc" }, { id: "asc" }],
    });

    return Response.json(matches);
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return apiError("Failed to fetch matches", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body: CreateMatchBody = await req.json();

    if (!body.tournamentId || !Number.isInteger(body.tournamentId)) {
      return apiError("tournamentId is required", 400);
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: body.tournamentId },
      select: { id: true, type: true },
    });

    if (!tournament) {
      return apiError("Tournament not found", 404);
    }

    const phase: MatchPhase = body.phase ?? "group";
    const bracketPhase = isBracketPhase(phase);

    if (!bracketPhase) {
      if (!body.teamAId) return apiError("teamAId is required", 400);
      if (!body.teamBId) return apiError("teamBId is required", 400);
    }

    if (
      body.teamAId != null &&
      body.teamBId != null &&
      body.teamAId === body.teamBId
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

    if (
      phase === "group" &&
      body.groupId == null &&
      tournament.type === "group_and_bracket"
    ) {
      return apiError('groupId is required when phase is "group"', 400);
    }

    if (body.groupId != null) {
      const tournamentGroup = await prisma.tournamentGroup.findUnique({
        where: { id: body.groupId },
      });

      if (!tournamentGroup) {
        return apiError("Group not found", 404);
      }

      if (tournamentGroup.tournamentId !== body.tournamentId) {
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

    if (body.nextMatchId != null && body.nextSlot == null) {
      return apiError("nextSlot is required when nextMatchId is set", 400);
    }

    if (body.loserNextMatchId != null && body.loserNextSlot == null) {
      return apiError("loserNextSlot is required when loserNextMatchId is set", 400);
    }

    if (body.nextMatchId != null) {
      const nextMatch = await prisma.match.findUnique({
        where: { id: body.nextMatchId },
        select: { id: true, tournamentId: true },
      });

      if (!nextMatch) {
        return apiError("nextMatch not found", 404);
      }

      if (nextMatch.tournamentId !== body.tournamentId) {
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

      if (loserNextMatch.tournamentId !== body.tournamentId) {
        return apiError("loserNextMatch must belong to the same tournament", 400);
      }
    }

    const status = deriveMatchStatus(body.scoreA, body.scoreB);

    const match = await prisma.match.create({
      data: {
        tournamentId: body.tournamentId,
        teamAId: body.teamAId ?? null,
        teamBId: body.teamBId ?? null,
        scoreA: body.scoreA ?? null,
        scoreB: body.scoreB ?? null,
        bodyCountA: body.bodyCountA ?? null,
        bodyCountB: body.bodyCountB ?? null,
        round: body.round ?? null,
        label: body.label?.trim() || null,
        field: body.field?.trim() || null,
        phase,
        groupId: body.groupId ?? null,
        nextMatchId: body.nextMatchId ?? null,
        nextSlot: body.nextSlot ?? null,
        loserNextMatchId: body.loserNextMatchId ?? null,
        loserNextSlot: body.loserNextSlot ?? null,
        bracketOrder: body.bracketOrder ?? null,
        nextMatchOrder: body.nextMatchOrder ?? null,
        manualOverride: body.manualOverride ?? false,
        status,
      },
      include: { teamA: true, teamB: true, group: true },
    });

    return Response.json(match, { status: 201 });
  } catch (error) {
    console.error("Failed to create match:", error);
    return apiError("Failed to create match", 500);
  }
}