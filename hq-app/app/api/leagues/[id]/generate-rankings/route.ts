import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";
import { ensureManualStandingTablesForLeague } from "@/lib/leagues/ensureManualStandingTablesForLeague";


export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);

    if (Number.isNaN(id)) {
      return apiError("Invalid league id", 400);
    }

    const league = await prisma.league.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!league) {
      return apiError("League not found", 404);
    }

    await ensureManualStandingTablesForLeague(id);

    return Response.json({
      success: true,
      message: "Rankings regenerated successfully",
    });
  } catch {
    return apiError("Failed to regenerate rankings", 500);
  }
}