import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body: { orderedIds?: number[] } = await req.json().catch(() => ({}));

    const orderedIds = body.orderedIds;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return apiError("orderedIds is required", 400);
    }

    if (!orderedIds.every((id) => Number.isInteger(id))) {
      return apiError("orderedIds must be an array of integers", 400);
    }

    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return apiError("orderedIds contains duplicates", 400);
    }

    await prisma.$transaction(
      orderedIds.map((id: number, index: number) =>
        prisma.division.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    const divisions = await prisma.division.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return Response.json({ divisions });
  } catch {
    return apiError("Failed to reorder divisions", 500);
  }
}