import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'
import type { UpdateLeagueBody } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        tournaments: {
          include: {
            division: true,
            teams: { include: { team: { include: { division: true } } } },
            matches: true,
          },
          orderBy: { date: 'desc' },
        },
        teams: { include: { team: { include: { division: true } } } },
      },
    })
    if (!league) return apiError('League not found', 404)
    return Response.json(league)
  } catch {
    return apiError('Failed to fetch league', 500)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    const body: UpdateLeagueBody = await req.json()

    if (body.name !== undefined && !body.name.trim()) {
      return apiError("League name is required");
    }

    const existingLeague = await prisma.league.findUnique({
      where: { id },
    });

    if (!existingLeague) {
      return apiError("League not found", 404);
    }

    if (body.teamIds !== undefined) {
      await prisma.leagueTeam.deleteMany({ where: { leagueId: id } })
      if (body.teamIds.length > 0) {
        await prisma.leagueTeam.createMany({
          data: body.teamIds.map(teamId => ({ leagueId: id, teamId })),
        })
      }
    }

    const league = await prisma.league.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() ?? null }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl?.trim() ?? null }),
      },
      include: {
        tournaments: {
          include: {
            division: true,
            teams: { include: { team: { include: { division: true } } } },
            matches: true,
          },
          orderBy: { date: "desc" },
        },
        teams: { include: { team: { include: { division: true } } } },
      },
    })

    return Response.json(league)
  } catch {
    return apiError("Failed to update league", 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)

    const existingLeague = await prisma.league.findUnique({
      where: { id },
    });

    if (!existingLeague) {
      return apiError("League not found", 404);
    }

    await prisma.league.delete({ where: { id } })
    return Response.json({ success: true })
  } catch {
    return apiError("Failed to delete league", 500)
  }
}