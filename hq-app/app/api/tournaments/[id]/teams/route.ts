import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return parseInt(id);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tournamentId = await getId(params);
    const { teamId } = await req.json();

    if (!teamId) {
      return Response.json({ error: "teamId is required" }, { status: 400 });
    }

    const enrollment = await prisma.tournamentTeam.create({
      data: { tournamentId, teamId },
      include: {
        team: true,
        groupLinks: {
          include: {
            group: true,
          },
        },
      },
    });

    return Response.json(enrollment, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return Response.json({ error: "Team already enrolled" }, { status: 409 });
    }
    return Response.json({ error: "Failed to enroll team" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tournamentId = await getId(params);
    const { teamId } = await req.json();

    if (!teamId) {
      return Response.json({ error: "teamId is required" }, { status: 400 });
    }

    await prisma.tournamentTeam.delete({
      where: { tournamentId_teamId: { tournamentId, teamId } },
    });

    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Failed to remove team" }, { status: 500 });
  }
}