import { prisma } from '@/lib/db'
import { apiError, calcStandings } from '@/lib/utils'
import { NextRequest } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: { include: { team: true } },
        matches: { include: { teamA: true, teamB: true } },
      },
    })

    if (!tournament) return apiError('Tournament not found', 404)

    const teamMap: Record<number, string> = {}
    tournament.teams.forEach((t) => {
      teamMap[t.teamId] = t.team.name
    })

    const standings = calcStandings(tournament.matches as any, teamMap)
    return Response.json(standings)
  } catch {
    return apiError('Failed to calculate standings', 500)
  }
}