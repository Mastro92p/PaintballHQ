import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const tournamentId = parseInt(rawId, 10);

    if (Number.isNaN(tournamentId)) {
      return apiError("Invalid id", 400);
    }

    const existing = await prisma.tournamentBracket.findMany({
      where: { tournamentId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });

    const nextSortOrder =
      existing.length > 0
        ? Math.max(...existing.map((bracket) => bracket.sortOrder ?? 0)) + 1
        : 0;

    const bracket = await prisma.tournamentBracket.create({
      data: {
        tournamentId,
        name: `Bracket ${existing.length + 1}`,
        sortOrder: nextSortOrder,
      },
    });

    return Response.json({ bracket });
  } catch {
    return apiError("Failed to create bracket", 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const tournamentId = parseInt(rawId, 10);

    if (Number.isNaN(tournamentId)) {
      return apiError("Invalid id", 400);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action !== "reorder") {
      return apiError("Invalid action", 400);
    }

    const bracketIds: number[] = Array.isArray(body.bracketIds)
      ? body.bracketIds
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isFinite(value))
      : [];

    if (bracketIds.length === 0) {
      return apiError("Bracket ids are required", 400);
    }

    const existing = await prisma.tournamentBracket.findMany({
      where: { tournamentId },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    if (existing.length !== bracketIds.length) {
      return apiError("Invalid bracket list", 400);
    }

    const existingIds = new Set<number>(
      existing.map((bracket) => bracket.id)
    );

    const hasOnlyValidIds =
      bracketIds.every((id: number) => existingIds.has(id)) &&
      new Set<number>(bracketIds).size === bracketIds.length;

    if (!hasOnlyValidIds) {
      return apiError("Invalid bracket ids", 400);
    }

    await prisma.$transaction(
      bracketIds.map((bracketId: number, index: number) =>
        prisma.tournamentBracket.update({
          where: { id: bracketId },
          data: { sortOrder: index },
        })
      )
    );

    const brackets = await prisma.tournamentBracket.findMany({
      where: { tournamentId },
      orderBy: { sortOrder: "asc" },
    });

    return Response.json({ brackets });
  } catch {
    return apiError("Failed to reorder brackets", 500);
  }
}