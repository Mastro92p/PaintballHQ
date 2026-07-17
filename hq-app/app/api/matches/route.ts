import { prisma } from "@/lib/db";
import { apiError, deriveMatchStatus } from "@/lib/utils";
import type { CreateMatchBody } from "@/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId");

    const matches = await prisma.match.findMany({
      where: tournamentId ? { tournamentId: parseInt(tournamentId, 10) } : undefined,
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

    if (!body.tournamentId) return apiError("tournamentId is required");
    if (!body.teamAId) return apiError("teamAId is required");
    if (!body.teamBId) return apiError("teamBId is required");
    if (body.teamAId === body.teamBId) {
      return apiError("A team cannot play against itself");
    }

    if (body.round != null && body.round < 1) {
      return apiError("Round must be at least 1");
    }

    if (body.phase === "group" && body.groupId == null) {
      return apiError('groupId is required when phase is "group"');
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

    const status = deriveMatchStatus(body.scoreA, body.scoreB);

    const match = await prisma.match.create({
      data: {
        tournamentId: body.tournamentId,
        teamAId: body.teamAId,
        teamBId: body.teamBId,
        scoreA: body.scoreA ?? null,
        scoreB: body.scoreB ?? null,
        bodyCountA: body.bodyCountA ?? null,
        bodyCountB: body.bodyCountB ?? null,
        round: body.round ?? null,
        label: body.label?.trim() || null,
        field: body.field?.trim() || null,
        phase: body.phase ?? "group",
        groupId: body.groupId ?? null,
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