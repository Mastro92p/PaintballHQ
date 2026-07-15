import { prisma } from "@/lib/db";
import { apiError } from "@/lib/utils";
import type { CreateDivisionBody } from "@/types";

export async function GET() {
  try {
    const divisions = await prisma.division.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return Response.json(divisions);
  } catch {
    return apiError("Failed to fetch divisions", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body: CreateDivisionBody = await req.json();
    const name = body.name?.trim();

    if (!name) {
      return apiError("name is required");
    }

    const existing = await prisma.division.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return apiError("Division already exists");
    }

    const division = await prisma.division.create({
      data: {
        name,
      },
    });

    return Response.json(division, { status: 201 });
  } catch {
    return apiError("Failed to create division", 500);
  }
}