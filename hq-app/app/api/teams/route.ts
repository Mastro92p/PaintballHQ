import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'
import type { CreateTeamBody } from '@/types'

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: 'asc' },
      include: {
        division: true,
        tournaments: { include: { tournament: true } },
        matchesA: { include: { teamB: true, tournament: true } },
        matchesB: { include: { teamA: true, tournament: true } },
      },
    })

    const enriched = teams.map((team) => {
      const allMatches = [...team.matchesA, ...team.matchesB]
      const totalMatches = allMatches.filter((m) => m.status === 'completed').length
      const wins = allMatches.filter(
        (m) =>
          m.status === 'completed' &&
          ((m.teamAId === team.id && (m.scoreA ?? 0) > (m.scoreB ?? 0)) ||
            (m.teamBId === team.id && (m.scoreB ?? 0) > (m.scoreA ?? 0)))
      ).length

      return {
        ...team,
        tournamentCount: team.tournaments.length,
        totalMatches,
        wins,
      }
    })

    return Response.json(enriched)
  } catch (error) {
    console.error('GET /api/teams failed:', error)
    return apiError('Failed to fetch teams', 500)
  }
}

export async function POST(req: Request) {
  try {
    const body: CreateTeamBody = await req.json()
    if (!body.name?.trim()) return apiError('Team name is required')

    const existing = await prisma.team.findFirst({
      where: { name: { equals: body.name.trim() } },
    })
    if (existing) return apiError('A team with this name already exists')

    const divisionId =
      body.divisionId === undefined || body.divisionId === null || body.divisionId === ''
        ? null
        : Number(body.divisionId)

    if (divisionId !== null && Number.isNaN(divisionId)) {
      return apiError('Invalid division')
    }

    const team = await prisma.team.create({
      data: {
        name: body.name.trim(),
        contact: body.contact?.trim() ?? null,
        divisionId,
      },
      include: { division: true },
    })

    return Response.json(team, { status: 201 })
  } catch (error) {
    console.error('POST /api/teams failed:', error)
    return apiError('Failed to create team', 500)
  }
}