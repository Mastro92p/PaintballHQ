import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";
import type { UpdateDivisionBody } from "@/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);

    const body: UpdateDivisionBody = await req.json();
    const { name, isActive } = body;

    const existingDivision = await prisma.division.findUnique({
      where: { id },
    });

    if (!existingDivision) {
      return apiError("Division not found", 404);
    }

    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) {
        return apiError("name cannot be empty");
      }

      const duplicate = await prisma.division.findFirst({
        where: {
          id: { not: id },
          name: { equals: trimmed, mode: "insensitive" },
        },
      });

      if (duplicate) {
        return apiError("Division already exists");
      }
    }

    const division = await prisma.division.update({
      where: { id },
      data: {
        name: name?.trim(),
        isActive,
      },
    });

    return Response.json(division);
  } catch {
    return apiError("Failed to update division", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);

    const [teamCount, tournamentCount] = await Promise.all([
      prisma.team.count({ where: { divisionId: id } }),
      prisma.tournament.count({ where: { divisionId: id } }),
    ]);

    if (teamCount > 0 || tournamentCount > 0) {
      return apiError(
        "Cannot delete a division still assigned to teams or tournaments. Deactivate it instead."
      );
    }

    await prisma.division.delete({ where: { id } });

    return Response.json({ success: true });
  } catch {
    return apiError("Failed to delete division", 500);
  }
}