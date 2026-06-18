import { prisma } from '@/lib/db'
import { apiError, deriveMatchStatus } from '@/lib/utils'
import type { UpdateMatchBody } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    const match = await prisma.match.findUnique({
      where: { id },
      include: { teamA: true, teamB: true, tournament: true },
    })
    if (!match) return apiError('Match not found', 404)
    return Response.json(match)
  } catch {
    return apiError('Failed to fetch match', 500)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    const body: UpdateMatchBody = await req.json()
    const current = await prisma.match.findUnique({ where: { id } })
    if (!current) return apiError('Match not found', 404)
    const newScoreA = body.scoreA !== undefined ? body.scoreA : current.scoreA
    const newScoreB = body.scoreB !== undefined ? body.scoreB : current.scoreB
    const status = deriveMatchStatus(newScoreA, newScoreB)
    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(body.teamAId !== undefined && { teamAId: body.teamAId }),
        ...(body.teamBId !== undefined && { teamBId: body.teamBId }),
        ...(body.scoreA  !== undefined && { scoreA: body.scoreA }),
        ...(body.scoreB  !== undefined && { scoreB: body.scoreB }),
        ...(body.round   !== undefined && { round: body.round }),
        ...(body.field   !== undefined && { field: body.field?.trim() ?? null }),
        status,
      },
      include: { teamA: true, teamB: true },
    })
    return Response.json(match)
  } catch {
    return apiError('Failed to update match', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    await prisma.match.delete({ where: { id } })
    return Response.json({ success: true })
  } catch {
    return apiError('Failed to delete match', 500)
  }
}