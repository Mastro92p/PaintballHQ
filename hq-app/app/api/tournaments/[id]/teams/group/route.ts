import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const tournamentId = parseInt(rawId)
    const body = await req.json()

    if (!body.teamId) return apiError('teamId is required')

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        groups: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
        },
        teams: {
          include: {
            groupLinks: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    })

    if (!tournament) return apiError('Tournament not found', 404)
    if (tournament.type !== 'group_and_bracket') {
      return apiError('Tournament is not group_and_bracket type', 400)
    }
    if (tournament.managementMode !== 'manual') {
      return apiError('Group assignment is only available in manual mode', 400)
    }

    const enrolled = tournament.teams.find((t) => t.teamId === body.teamId)
    if (!enrolled) return apiError('Team is not enrolled in this tournament', 400)

    const nextGroupIds: number[] = Array.isArray(body.groupIds)
      ? body.groupIds
          .map((id: unknown) => Number(id))
          .filter((id: number) => !Number.isNaN(id))
      : []

    const validGroupIds = new Set<number>(tournament.groups.map((g) => g.id))

    const invalidGroupIds = nextGroupIds.filter(
      (groupId: number) => !validGroupIds.has(groupId)
    )

    if (invalidGroupIds.length > 0) {
      return apiError(
        `Invalid group id(s): ${invalidGroupIds.join(', ')}`,
        400
      )
    }

    await prisma.$transaction([
      prisma.tournamentTeamGroup.deleteMany({
        where: {
          tournamentId,
          teamId: body.teamId,
        },
      }),
      ...nextGroupIds.map((groupId: number) =>
        prisma.tournamentTeamGroup.create({
          data: {
            tournamentId,
            teamId: body.teamId,
            groupId,
          },
        })
      ),
    ])

    const updated = await prisma.tournamentTeam.findUnique({
      where: {
        tournamentId_teamId: {
          tournamentId,
          teamId: body.teamId,
        },
      },
      include: {
        team: true,
        groupLinks: {
          include: {
            group: true,
          },
        },
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error(error)
    return apiError('Failed to assign team to group', 500)
  }
}