import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { divisionId: null },
          { division: { isActive: true } },
        ],
      },
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
    console.error('GET /api/public/teams failed:', error)
    return Response.json(
      {
        error: 'Failed to fetch public teams',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}