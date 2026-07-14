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
    const { id } = await params
    const matchId = Number(id)
    const body: UpdateMatchBody & { status?: string } = await req.json()

    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
    })

    if (!existingMatch) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    const nextTeamAId = body.teamAId ?? existingMatch.teamAId
    const nextTeamBId = body.teamBId ?? existingMatch.teamBId

    if (
      nextTeamAId != null &&
      nextTeamBId != null &&
      nextTeamAId === nextTeamBId
    ) {
      return apiError('A team cannot play against itself')
    }

    if (body.round != null && body.round < 1) {
      return apiError('Round must be at least 1')
    }

    const nextScoreA =
      body.scoreA !== undefined ? body.scoreA : existingMatch.scoreA
    const nextScoreB =
      body.scoreB !== undefined ? body.scoreB : existingMatch.scoreB

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        teamAId: body.teamAId,
        teamBId: body.teamBId,
        scoreA: body.scoreA,
        scoreB: body.scoreB,
        bodyCountA: body.bodyCountA,
        bodyCountB: body.bodyCountB,
        round: body.round,
        label:
          body.label !== undefined
            ? body.label?.trim() || null
            : undefined,
        field:
          body.field !== undefined
            ? body.field?.trim() || null
            : undefined,
        status: body.status || deriveMatchStatus(nextScoreA ?? undefined, nextScoreB ?? undefined),
      },
    })

    const isKnockoutPhase =
      updatedMatch.phase === 'round_of_32' ||
      updatedMatch.phase === 'round_of_16' ||
      updatedMatch.phase === 'quarter_final' ||
      updatedMatch.phase === 'semi_final' ||
      updatedMatch.phase === 'final'

    if (!isKnockoutPhase) {
      return Response.json(updatedMatch)
    }

    if (
      updatedMatch.scoreA == null ||
      updatedMatch.scoreB == null ||
      updatedMatch.teamAId == null ||
      updatedMatch.teamBId == null
    ) {
      return Response.json(updatedMatch)
    }

    if (updatedMatch.scoreA === updatedMatch.scoreB) {
      return Response.json(updatedMatch)
    }

    if (updatedMatch.phase === 'final') {
      return Response.json(updatedMatch)
    }

    const winnerId =
      updatedMatch.scoreA > updatedMatch.scoreB
        ? updatedMatch.teamAId
        : updatedMatch.teamBId

    const loserId =
      updatedMatch.scoreA > updatedMatch.scoreB
        ? updatedMatch.teamBId
        : updatedMatch.teamAId

    if (updatedMatch.nextMatchId && updatedMatch.nextSlot) {
      const targetMatch = await prisma.match.findUnique({
        where: { id: updatedMatch.nextMatchId },
      })

      if (targetMatch) {
        await prisma.match.update({
          where: { id: targetMatch.id },
          data: { [updatedMatch.nextSlot]: winnerId },
        })
      }
    }

    if (updatedMatch.loserNextMatchId && updatedMatch.loserNextSlot) {
      const loserTargetMatch = await prisma.match.findUnique({
        where: { id: updatedMatch.loserNextMatchId },
      })

      if (loserTargetMatch) {
        await prisma.match.update({
          where: { id: loserTargetMatch.id },
          data: { [updatedMatch.loserNextSlot]: loserId },
        })
      }
    }

    return Response.json(updatedMatch)
  } catch (error) {
    console.error('Error updating match:', error)
    return Response.json({ error: 'Failed to update match' }, { status: 500 })
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