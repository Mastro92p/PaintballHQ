import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";

type GroupActionBody =
  | { action: "add"; name?: string }
  | { action: "rename"; groupId: number; newName?: string }
  | { action: "delete"; groupId: number }
  | { action: "reorder"; groupIds: number[] };

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const tournamentId = parseInt(rawId, 10);
    const body: GroupActionBody = await req.json();

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        groups: {
          orderBy: [{ order: "asc" }, { id: "asc" }],
        },
      },
    });

    if (!tournament) return apiError("Tournament not found", 404);
    if (tournament.type !== "group_and_bracket") {
      return apiError("Tournament is not group_and_bracket type", 400);
    }
    if (tournament.managementMode !== "manual") {
      return apiError("Group management is only available in manual mode", 400);
    }

    const groups = tournament.groups;

    if (body.action === "add") {
      const fallback = "ABCDEFGH"[groups.length] ?? `Group ${groups.length + 1}`;
      const name = body.name?.trim() || fallback;

      if (groups.some((g) => g.name === name)) {
        return apiError("A group with this name already exists", 400);
      }

      const created = await prisma.tournamentGroup.create({
        data: {
          tournamentId,
          name,
          order: groups.length,
        },
      });

      return Response.json({
        success: true,
        group: created,
        groups: [...groups, created],
      });
    }

    if (body.action === "rename") {
      const groupId = Number(body.groupId);
      const group = groups.find((g) => g.id === groupId);

      if (!group) return apiError("Group not found", 404);

      const fallback = "ABCDEFGH"[group.order] ?? group.name;
      const finalName = body.newName?.trim() || fallback;

      if (finalName !== group.name && groups.some((g) => g.name === finalName)) {
        return apiError("A group with this name already exists", 400);
      }

      const updated = await prisma.tournamentGroup.update({
        where: { id: group.id },
        data: { name: finalName },
      });

      const refreshedGroups = await prisma.tournamentGroup.findMany({
        where: { tournamentId },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      });

      return Response.json({
        success: true,
        group: updated,
        groups: refreshedGroups,
      });
    }

    if (body.action === "delete") {
      const groupId = Number(body.groupId);
      const group = groups.find((g) => g.id === groupId);

      if (!group) return apiError("Group not found", 404);

      await prisma.$transaction([
        prisma.match.deleteMany({
          where: {
            tournamentId,
            groupId: group.id,
            phase: "group",
          },
        }),
        prisma.tournamentTeamGroup.deleteMany({
          where: {
            groupId: group.id,
            tournamentId,
          },
        }),
        prisma.tournamentGroup.delete({
          where: { id: group.id },
        }),
      ]);

      const remainingGroups = await prisma.tournamentGroup.findMany({
        where: { tournamentId },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      });

      return Response.json({
        success: true,
        groups: remainingGroups,
      });
    }


    if (body.action === "reorder") {
      const nextGroupIds = body.groupIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id));

      if (nextGroupIds.length !== groups.length) {
        return apiError("All groups must be included in reorder payload", 400);
      }

      const validGroupIds = new Set(groups.map((g) => g.id));
      const invalidGroupIds = nextGroupIds.filter((groupId: number) => !validGroupIds.has(groupId));

      if (invalidGroupIds.length > 0) {
        return apiError("Invalid group ids in reorder payload", 400);
      }

      await prisma.$transaction(
        nextGroupIds.map((groupId, index) =>
          prisma.tournamentGroup.update({
            where: { id: groupId },
            data: { order: index },
          })
        )
      );

      const reorderedGroups = await prisma.tournamentGroup.findMany({
        where: { tournamentId },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      });

      return Response.json({
        success: true,
        groups: reorderedGroups,
      });
    }

    return apiError("Invalid action", 400);
  } catch (error) {
    console.error(error);
    return apiError("Failed to update groups", 500);
  }
}