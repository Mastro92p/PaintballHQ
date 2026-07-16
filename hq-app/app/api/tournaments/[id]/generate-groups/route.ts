import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'
import type { FormatConfig } from '@/types'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)

    // ── 1. Load tournament ──────────────────────────────────────────
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { teams: { include: { team: true } } },
    })

    if (!tournament)                            return apiError('Tournament not found', 404)
    if (tournament.type !== 'group_and_bracket') return apiError('Tournament is not group_and_bracket type', 400)
    if (!tournament.formatConfig)               return apiError('Tournament has no formatConfig', 400)

    const fc = tournament.formatConfig as FormatConfig

    const enrolledTeams = tournament.teams.map((tt) => tt.team)

    if (fc.groupCount == null || fc.teamsPerGroup == null) {
      return apiError('Missing group configuration (groupCount or teamsPerGroup)', 400)
    }

    const groupCount = fc.groupCount
    const teamsPerGroup = fc.teamsPerGroup
    const totalExpected = groupCount * teamsPerGroup

    if (enrolledTeams.length < 2) {
      return apiError('Not enough teams enrolled (minimum 2)', 400)
    }

    // ── 3. Wipe any existing group-stage matches ────────────────────
    await prisma.match.deleteMany({
      where: { tournamentId: id, phase: 'group' },
    })

    // ── 4. Shuffle & split teams into groups ────────────────────────
    const shuffled = [...enrolledTeams].sort(() => Math.random() - 0.5)

    // Split into fc.groupCount buckets
    const groups: (typeof enrolledTeams)[] = Array.from(
      { length: fc.groupCount },
      () => []
    )
    shuffled.forEach((team, i) => {
      groups[i % groupCount].push(team)
    })

    // ── 5. Generate round-robin matches per group ───────────────────
    // Label groups A, B, C...
    const groupLabels = 'ABCDEFGH'.split('')

    const matchesToCreate: {
      tournamentId: number
      teamAId:      number
      teamBId:      number
      phase:        string
      group:        string
      round:        number
      status:       string
    }[] = []

    for (let g = 0; g < groups.length; g++) {
      const groupTeams = groups[g]
      const label      = groupLabels[g]

      // Round-robin: every team plays every other team once
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          matchesToCreate.push({
            tournamentId: id,
            teamAId:      groupTeams[i].id,
            teamBId:      groupTeams[j].id,
            phase:        'group',
            group:        label,
            round:        1,
            status:       'pending',
          })
        }
      }
    }

    // ── 6. Save all matches ─────────────────────────────────────────
    await prisma.match.createMany({ data: matchesToCreate })

    // ── 7. Update tournament status ─────────────────────────────────
    await prisma.tournament.update({
      where: { id },
      data:  { status: 'active' },
    })

    // ── 8. Return summary ───────────────────────────────────────────
    return Response.json({
      success:       true,
      groups:        groups.map((teams, i) => ({
        label:        groupLabels[i],
        teams:        teams.map((t) => ({ id: t.id, name: t.name })),
      })),
      matchesCreated: matchesToCreate.length,
      totalTeams:     enrolledTeams.length,
      expectedTeams:  totalExpected,
      warning:        enrolledTeams.length !== totalExpected
        ? `Expected ${totalExpected} teams but found ${enrolledTeams.length}. Groups were distributed evenly.`
        : undefined,
    })

  } catch {
    return apiError('Failed to generate groups', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const tournamentId = parseInt(rawId)

    await prisma.match.deleteMany({
      where: { tournamentId, phase: 'group' },
    })

    await prisma.tournamentTeam.updateMany({
      where: { tournamentId },
      data: { groups: { set: [] } },
    })

    return Response.json({ success: true })
  } catch {
    return apiError('Failed to reset group stage', 500)
  }
}