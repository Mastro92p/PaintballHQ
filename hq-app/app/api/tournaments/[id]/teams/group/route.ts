import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'
import type { FormatConfig } from '@/types'

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
      include: { teams: true },
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

    const fc = (tournament.formatConfig ?? {}) as FormatConfig
    const groupLabels = fc.groups ?? []

    const nextGroups = Array.isArray(body.groups) ? body.groups : []

    const invalidGroups = nextGroups.filter(
      (group: string) => !groupLabels.includes(group)
    )

    if (invalidGroups.length > 0) {
      return apiError(
        `Invalid group(s): ${invalidGroups.join(', ')}. Must be one of: ${groupLabels.join(', ')}`,
        400
      )
    }

    const updated = await prisma.tournamentTeam.update({
      where: {
        tournamentId_teamId: {
          tournamentId,
          teamId: body.teamId,
        },
      },
      data: {
        groups: nextGroups,
      },
    })

    return Response.json(updated)
  } catch {
    return apiError('Failed to assign team to group', 500)
  }
}