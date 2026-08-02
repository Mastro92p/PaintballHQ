import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; dayId: string }>;
  }
) {
  try {
    const { id: rawLeagueId, dayId: rawDayId } = await params;

    const leagueId = Number(rawLeagueId);
    const dayId = Number(rawDayId);

    if (Number.isNaN(leagueId) || Number.isNaN(dayId)) {
      return apiError("Invalid league id or day id", 400);
    }

    const day = await prisma.leagueManualStandingDay.findUnique({
      where: { id: dayId },
      include: {
        table: {
          select: {
            id: true,
            leagueId: true,
            divisionId: true,
          },
        },
      },
    });

    if (!day) {
      return apiError("Manual ranking day not found", 404);
    }

    if (day.table.leagueId !== leagueId) {
      return apiError("Manual ranking day does not belong to this league", 400);
    }

    await prisma.leagueManualStandingDay.delete({
      where: { id: dayId },
    });

    const remainingDays = await prisma.leagueManualStandingDay.count({
      where: { tableId: day.table.id },
    });

    if (remainingDays === 0) {
      await prisma.leagueManualStandingTable.delete({
        where: { id: day.table.id },
      });
    }

    return Response.json({
      success: true,
      deletedDayId: dayId,
      deletedEmptyTable: remainingDays === 0,
    });
  } catch {
    return apiError("Failed to delete manual ranking day", 500);
  }
}