import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";


export async function PATCH(
  req: Request,
  {
    params,
  }: { params: Promise<{ id: string; bracketId: string }> }
) {
  try {
    const { id: rawId, bracketId: rawBracketId } = await params;
    const tournamentId = parseInt(rawId, 10);
    const bracketId = parseInt(rawBracketId, 10);

    if (Number.isNaN(tournamentId) || Number.isNaN(bracketId)) {
      return apiError("Invalid id", 400);
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return apiError("Bracket name is required", 400);
    }

    const existing = await prisma.tournamentBracket.findFirst({
      where: {
        id: bracketId,
        tournamentId,
      },
      select: { id: true },
    });

    if (!existing) {
      return apiError("Bracket not found", 404);
    }

    const bracket = await prisma.tournamentBracket.update({
      where: { id: bracketId },
      data: { name },
    });

    return Response.json({ bracket });
  } catch {
    return apiError("Failed to update bracket", 500);
  }
}

export async function DELETE(
  _req: Request,
  {
    params,
  }: { params: Promise<{ id: string; bracketId: string }> }
) {
  try {
    const { id: rawId, bracketId: rawBracketId } = await params;
    const tournamentId = parseInt(rawId, 10);
    const bracketId = parseInt(rawBracketId, 10);

    if (Number.isNaN(tournamentId) || Number.isNaN(bracketId)) {
      return apiError("Invalid id", 400);
    }

    const bracket = await prisma.tournamentBracket.findFirst({
      where: {
        id: bracketId,
        tournamentId,
      },
      select: { id: true },
    });

    if (!bracket) {
      return apiError("Bracket not found", 404);
    }

    await prisma.match.deleteMany({
      where: {
        tournamentId,
        bracketId,
      },
    });

    await prisma.tournamentBracket.delete({
      where: { id: bracketId },
    });

    return Response.json({ success: true, deletedBracketId: bracketId });
  } catch {
    return apiError("Failed to delete bracket", 500);
  }
}