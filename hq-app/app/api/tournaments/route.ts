import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'
import type { CreateTournamentBody } from '@/types'

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { date: 'desc' },
      include: { teams: { include: { team: true } }, matches: true },
    })
    return Response.json(tournaments)
  } catch {
    return apiError('Failed to fetch tournaments', 500)
  }
}

export async function POST(req: Request) {
  try {
    const body: CreateTournamentBody = await req.json()
    if (!body.name?.trim()) return apiError('Tournament name is required')
    if (!body.date) return apiError('Date is required')
    if (!body.location?.trim()) return apiError('Location is required')
    const tournament = await prisma.tournament.create({
      data: {
        name: body.name.trim(),
        date: body.date,
        location: body.location.trim(),
        status: body.status ?? 'upcoming',
        teams: body.teamIds?.length
          ? { create: body.teamIds.map(teamId => ({ teamId })) }
          : undefined,
      },
      include: { teams: { include: { team: true } } },
    })
    return Response.json(tournament, { status: 201 })
  } catch {
    return apiError('Failed to create tournament', 500)
  }
}