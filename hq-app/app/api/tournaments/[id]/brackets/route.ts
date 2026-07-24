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
      return apiError("Invalid tournament id", 400);
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });

    if (!tournament) {
      return apiError("Tournament not found", 404);
    }

    const existingCount = await prisma.tournamentBracket.count({
      where: { tournamentId },
    });

    const bracket = await prisma.tournamentBracket.create({
      data: {
        tournamentId,
        name: `Bracket ${existingCount + 1}`,
        sortOrder: existingCount,
      },
    });

    return Response.json({ bracket }, { status: 201 });
  } catch {
    return apiError("Failed to create bracket", 500);
  }
}