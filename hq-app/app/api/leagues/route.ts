import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'
import type { CreateLeagueBody } from '@/types'

export async function GET() {
  try {
    const leagues = await prisma.league.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tournaments: true,
        teams: { include: { team: true } },
      },
    })
    return Response.json(leagues)
  } catch {
    return apiError('Failed to fetch leagues', 500)
  }
}

export async function POST(req: Request) {
  try {
    const body: CreateLeagueBody = await req.json()
    if (!body.name?.trim()) {
      return apiError("League name is required");
    }
    const league = await prisma.league.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        logoUrl: body.logoUrl?.trim() ?? null,
        teams: body.teamIds?.length
          ? { create: body.teamIds.map(teamId => ({ teamId })) }
          : undefined,
      },
      include: {
        tournaments: true,
        teams: { include: { team: true } },
      },
    })
    return Response.json(league, { status: 201 })
  } catch {
    return apiError('Failed to create league', 500)
  }
}