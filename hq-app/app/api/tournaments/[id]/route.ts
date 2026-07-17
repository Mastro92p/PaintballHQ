import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'
import type { UpdateTournamentBody } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        division: true,
        groups: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
        },
        teams: {
          include: {
            team: true,
            groupLinks: {
              include: {
                group: true,
              },
            },
          },
        },
        matches: {
          include: {
            teamA: true,
            teamB: true,
            group: true,
          },
          orderBy: [{ round: 'asc' }, { id: 'asc' }],
        },
      },
    })

    if (!tournament) return apiError('Tournament not found', 404)
    return Response.json(tournament)
  } catch {
    return apiError('Failed to fetch tournament', 500)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    const body: UpdateTournamentBody = await req.json()

    if (body.teamIds !== undefined) {
      await prisma.tournamentTeam.deleteMany({ where: { tournamentId: id } })

      if (body.teamIds.length > 0) {
        await prisma.tournamentTeam.createMany({
          data: body.teamIds.map((teamId) => ({ tournamentId: id, teamId })),
        })
      }
    }

    let divisionId: number | null | undefined = undefined
    if (body.divisionId !== undefined) {
      divisionId =
        body.divisionId === null || body.divisionId === ''
          ? null
          : Number(body.divisionId)

      if (divisionId !== null && Number.isNaN(divisionId)) {
        return apiError('Invalid division')
      }
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.date && { date: body.date }),
        ...(body.location && { location: body.location.trim() }),
        ...(body.status && { status: body.status }),
        ...(body.type && { type: body.type }),
        ...(body.managementMode && { managementMode: body.managementMode }),
        ...(body.formatConfig !== undefined && { formatConfig: body.formatConfig ?? null }),
        ...(body.teamsToAdvance && { teamsToAdvance: body.teamsToAdvance }),
        ...(body.leagueId !== undefined && { leagueId: body.leagueId ?? null }),
        ...(divisionId !== undefined && { divisionId }),
      },
      include: {
        division: true,
        groups: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
        },
        teams: {
          include: {
            team: true,
            groupLinks: {
              include: {
                group: true,
              },
            },
          },
        },
        matches: {
          include: {
            teamA: true,
            teamB: true,
            group: true,
          },
          orderBy: [{ round: 'asc' }, { id: 'asc' }],
        },
      },
    })

    return Response.json(tournament)
  } catch {
    return apiError('Failed to update tournament', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    await prisma.tournament.delete({ where: { id } })
    return Response.json({ success: true })
  } catch {
    return apiError('Failed to delete tournament', 500)
  }
}