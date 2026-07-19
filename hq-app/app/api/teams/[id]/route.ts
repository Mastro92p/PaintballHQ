import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'
import type { UpdateTeamBody } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId, 10)

    if (Number.isNaN(id)) {
      return apiError('Invalid team id', 400)
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        division: true,
        tournaments: { include: { tournament: true } },
        matchesA: {
          include: {
            teamB: { select: { id: true, name: true } },
            tournament: { select: { id: true, name: true } },
          },
        },
        matchesB: {
          include: {
            teamA: { select: { id: true, name: true } },
            tournament: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!team) return apiError('Team not found', 404)
    return Response.json(team)
  } catch {
    return apiError('Failed to fetch team', 500)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId, 10)

    if (Number.isNaN(id)) {
      return apiError('Invalid team id', 400)
    }

    const body: UpdateTeamBody = await req.json()

    const existingTeam = await prisma.team.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingTeam) {
      return apiError('Team not found', 404)
    }

    let divisionId: number | null | undefined = undefined
    if (body.divisionId !== undefined) {
      divisionId =
        body.divisionId === null || body.divisionId === ''
          ? null
          : Number(body.divisionId)

      if (divisionId !== null && Number.isNaN(divisionId)) {
        return apiError('Invalid division', 400)
      }

      if (divisionId !== null) {
        const divisionExists = await prisma.division.findUnique({
          where: { id: divisionId },
          select: { id: true },
        })

        if (!divisionExists) {
          return apiError('Division not found', 404)
        }
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.contact !== undefined && { contact: body.contact?.trim() ?? null }),
        ...(divisionId !== undefined && { divisionId }),
      },
      include: { division: true },
    })

    return Response.json(team)
  } catch {
    return apiError('Failed to update team', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId, 10)

    if (Number.isNaN(id)) {
      return apiError('Invalid team id', 400)
    }

    const existingTeam = await prisma.team.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingTeam) {
      return apiError('Team not found', 404)
    }

    await prisma.team.delete({ where: { id } })
    return Response.json({ success: true })
  } catch {
    return apiError('Failed to delete team', 500)
  }
}