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
    const body = await req.json()

    const {
      scoreA,
      scoreB,
      status,
      teamAId,
      teamBId,
    } = body

    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
    })

    if (!existingMatch) {
      return Response.json({ error: "Match not found" }, { status: 404 })
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreA,
        scoreB,
        status: status || deriveMatchStatus(scoreA, scoreB),
        teamAId,
        teamBId,
      },
    })

    //const isCompleted = updatedMatch.status === "completed"
    const isKnockoutPhase =
      updatedMatch.phase === "round_of_32" ||
      updatedMatch.phase === "round_of_16" ||
      updatedMatch.phase === "quarter_final" ||
      updatedMatch.phase === "semi_final" ||
      updatedMatch.phase === "final"

      //(!isCompleted || !isKnockoutPhase)
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

    if (updatedMatch.phase === "final") {
      return Response.json(updatedMatch)
    }

    const winnerId =
      updatedMatch.scoreA > updatedMatch.scoreB
        ? updatedMatch.teamAId
        : updatedMatch.teamBId

      if (!updatedMatch.nextMatchId || !updatedMatch.nextSlot) {
        return Response.json(updatedMatch)
      }

      const targetMatch = await prisma.match.findUnique({
        where: { id: updatedMatch.nextMatchId },
      })

      if (!targetMatch) {
        return Response.json(updatedMatch)
      }

      if (updatedMatch.nextSlot === "teamAId") {

        await prisma.match.update({
          where: { id: targetMatch.id },
          data: { teamAId: winnerId },
        })
      } else {

        await prisma.match.update({
          where: { id: targetMatch.id },
          data: { teamBId: winnerId },
        })
      }

        return Response.json(updatedMatch)

      } catch (error) {
        console.error("Error updating match:", error)
        return Response.json({ error: "Failed to update match" }, { status: 500 })
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