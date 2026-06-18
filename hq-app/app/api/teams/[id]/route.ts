import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'
import type { UpdateTeamBody } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        tournaments: { include: { tournament: true } },
        matchesA: true,
        matchesB: true,
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
    const id = parseInt(rawId)
    const body: UpdateTeamBody = await req.json()
    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.contact !== undefined && { contact: body.contact?.trim() ?? null }),
      },
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
    const id = parseInt(rawId)
    await prisma.team.delete({ where: { id } })
    return Response.json({ success: true })
  } catch {
    return apiError('Failed to delete team', 500)
  }
}