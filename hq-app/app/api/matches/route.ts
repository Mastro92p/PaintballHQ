import { prisma } from '@/lib/db'
import { apiError, deriveMatchStatus } from '@/lib/utils'
import type { CreateMatchBody } from '@/types'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tournamentId = searchParams.get('tournamentId')
    const matches = await prisma.match.findMany({
      where: tournamentId ? { tournamentId: parseInt(tournamentId) } : undefined,
      include: { teamA: true, teamB: true },
      orderBy: [{ round: 'asc' }, { id: 'asc' }],
    })
    return Response.json(matches)
  } catch {
    return apiError('Failed to fetch matches', 500)
  }
}

export async function POST(req: Request) {
  try {
    const body: CreateMatchBody = await req.json()
    if (!body.tournamentId) return apiError('tournamentId is required')
    if (!body.teamAId) return apiError('teamAId is required')
    if (!body.teamBId) return apiError('teamBId is required')
    if (body.teamAId === body.teamBId) return apiError('A team cannot play against itself')
    const status = deriveMatchStatus(body.scoreA, body.scoreB)
    const match = await prisma.match.create({
      data: {
        tournamentId: body.tournamentId,
        teamAId: body.teamAId,
        teamBId: body.teamBId,
        scoreA: body.scoreA ?? null,
        scoreB: body.scoreB ?? null,
        round: body.round ?? 1,
        field: body.field?.trim() ?? null,
        status,
      },
      include: { teamA: true, teamB: true },
    })
    return Response.json(match, { status: 201 })
  } catch {
    return apiError('Failed to create match', 500)
  }
}