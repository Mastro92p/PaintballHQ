import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'
import type { FormatConfig } from '@/types'

type GroupActionBody =
  | { action: 'add'; name?: string }
  | { action: 'rename'; oldName: string; newName?: string }
  | { action: 'delete'; name: string }

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const tournamentId = parseInt(rawId)
    const body: GroupActionBody = await req.json()

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: true, matches: true },
    })

    if (!tournament) return apiError('Tournament not found', 404)
    if (tournament.type !== 'group_and_bracket') {
      return apiError('Tournament is not group_and_bracket type', 400)
    }
    if (tournament.managementMode !== 'manual') {
      return apiError('Group management is only available in manual mode', 400)
    }

    const fc = (tournament.formatConfig ?? {}) as FormatConfig
    const groups = fc.groups ?? []

    if (body.action === 'add') {
      const fallback = 'ABCDEFGH'[groups.length] ?? `Group ${groups.length + 1}`
      const name = body.name?.trim() || fallback

      if (groups.includes(name)) {
        return apiError('A group with this name already exists', 400)
      }

      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { formatConfig: { ...fc, groups: [...groups, name] } },
      })

      return Response.json({ success: true, groups: [...groups, name] })
    }

    if (body.action === 'rename') {
      const { oldName, newName } = body
      const idx = groups.indexOf(oldName)
      if (idx === -1) return apiError('Group not found', 404)

      const fallback = 'ABCDEFGH'[idx] ?? oldName
      const finalName = newName?.trim() || fallback

      if (finalName !== oldName && groups.includes(finalName)) {
        return apiError('A group with this name already exists', 400)
      }

      const updatedGroups = groups.map((g) => (g === oldName ? finalName : g))

      await prisma.$transaction([
        prisma.tournament.update({
          where: { id: tournamentId },
          data: { formatConfig: { ...fc, groups: updatedGroups } },
        }),
        ...tournament.teams.map((tt) =>
          prisma.tournamentTeam.update({
            where: {
              tournamentId_teamId: {
                tournamentId,
                teamId: tt.teamId,
              },
            },
            data: {
              groups: (tt.groups ?? []).map((g) => (g === oldName ? finalName : g)),
            },
          })
        ),
        prisma.match.updateMany({
          where: { tournamentId, group: oldName },
          data: { group: finalName },
        }),
      ])

      return Response.json({ success: true, groups: updatedGroups })
    }

    if (body.action === 'delete') {
      const { name } = body
      if (!groups.includes(name)) return apiError('Group not found', 404)

      const updatedGroups = groups.filter((g) => g !== name)

      await prisma.$transaction([
        prisma.match.deleteMany({
          where: { tournamentId, group: name, phase: 'group' },
        }),
        ...tournament.teams.map((tt) =>
          prisma.tournamentTeam.update({
            where: {
              tournamentId_teamId: {
                tournamentId,
                teamId: tt.teamId,
              },
            },
            data: {
              groups: (tt.groups ?? []).filter((g) => g !== name),
            },
          })
        ),
        prisma.tournament.update({
          where: { id: tournamentId },
          data: { formatConfig: { ...fc, groups: updatedGroups } },
        }),
      ])

      return Response.json({ success: true, groups: updatedGroups })
    }

    return apiError('Invalid action', 400)
  } catch (error) {
    console.error(error)
    return apiError('Failed to update groups', 500)
  }
}