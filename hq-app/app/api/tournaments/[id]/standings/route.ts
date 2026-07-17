import { prisma } from '@/lib/db'
import { apiError, calcStandings } from '@/lib/utils'
import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    const url = new URL(req.url)
    const groupIdParam = url.searchParams.get('groupId')
    const groupId = groupIdParam ? parseInt(groupIdParam) : null

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
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
        groups: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
        },
        matches: {
          include: {
            teamA: true,
            teamB: true,
            group: true,
          },
        },
      },
    })

    if (!tournament) return apiError('Tournament not found', 404)

    if (groupId != null && Number.isNaN(groupId)) {
      return apiError('Invalid groupId', 400)
    }

    if (groupId != null) {
      const groupExists = tournament.groups.some((group) => group.id === groupId)
      if (!groupExists) return apiError('Group not found in this tournament', 404)
    }

    const relevantTeams = groupId != null
      ? tournament.teams.filter((tt) =>
          tt.groupLinks.some((link) => link.groupId === groupId)
        )
      : tournament.teams

    const relevantTeamIds = new Set<number>(relevantTeams.map((tt) => tt.teamId))

    const relevantMatches = tournament.matches.filter((match) => {
      if (match.phase !== 'group') return false

      if (groupId != null) {
        return match.groupId === groupId
      }

      if (match.teamAId == null || match.teamBId == null) {
        return false
      }

      return (
        relevantTeamIds.has(match.teamAId) &&
        relevantTeamIds.has(match.teamBId)
      )
    })

    const teamMap: Record<number, string> = {}
    relevantTeams.forEach((t) => {
      teamMap[t.teamId] = t.team.name
    })

    const standings = calcStandings(relevantMatches as any, teamMap)

    return Response.json({
      tournamentId: tournament.id,
      groupId,
      standings,
    })
  } catch (error) {
    console.error(error)
    return apiError('Failed to calculate standings', 500)
  }
}