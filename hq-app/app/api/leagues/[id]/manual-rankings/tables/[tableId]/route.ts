import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; tableId: string }>;
  }
) {
  try {
    const { id: rawLeagueId, tableId: rawTableId } = await params;

    const leagueId = Number(rawLeagueId);
    const tableId = Number(rawTableId);

    if (Number.isNaN(leagueId) || Number.isNaN(tableId)) {
      return apiError("Invalid league id or table id", 400);
    }

    const table = await prisma.leagueManualStandingTable.findUnique({
      where: { id: tableId },
      select: {
        id: true,
        leagueId: true,
      },
    });

    if (!table) {
      return apiError("Manual ranking table not found", 404);
    }

    if (table.leagueId !== leagueId) {
      return apiError("Manual ranking table does not belong to this league", 400);
    }

    await prisma.leagueManualStandingTable.delete({
      where: { id: tableId },
    });

    return Response.json({
      success: true,
      deletedTableId: tableId,
    });
  } catch {
    return apiError("Failed to delete manual ranking table", 500);
  }
}