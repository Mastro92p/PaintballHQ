import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'
import type { FormatConfig, AssignTeamGroupBody } from '@/types'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const tournamentId = parseInt(rawId)
    const body: AssignTeamGroupBody = await req.json()

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

    // ── Validate group label & capacity ─────────────────────────
    if (body.group !== null) {
      const fc = (tournament.formatConfig ?? {}) as FormatConfig
      const groupLabels = 'ABCDEFGH'.slice(0, fc.groupCount ?? 0).split('')

      if (!groupLabels.includes(body.group)) {
        return apiError(`Invalid group. Must be one of: ${groupLabels.join(', ')}`, 400)
      }

      if (fc.teamsPerGroup != null) {
        const currentCount = tournament.teams.filter(
          (t) => t.group === body.group && t.teamId !== body.teamId
        ).length

        if (currentCount >= fc.teamsPerGroup) {
          return apiError(`Group ${body.group} is full (${fc.teamsPerGroup} teams max)`, 400)
        }
      }
    }

    const updated = await prisma.tournamentTeam.update({
      where: {
        tournamentId_teamId: {
          tournamentId,
          teamId: body.teamId,
        },
      },
      data: { group: body.group },
    })

    return Response.json(updated)
  } catch {
    return apiError('Failed to assign team to group', 500)
  }
}