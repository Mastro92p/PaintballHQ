import type { Match, Standing } from '@/types'

export function deriveMatchStatus(
  scoreA: number | null | undefined,
  scoreB: number | null | undefined
): 'pending' | 'completed' {
  return scoreA != null && scoreB != null ? 'completed' : 'pending'
}

export function calcStandings(
  matches: Match[],
  teamMap: Record<number, string>,
  enrolledTeamIds: number[] = []   // ← add this parameter
): Standing[] {
  const table: Record<number, Standing> = {}

    // Seed from enrolled teams first — ensures 0-match teams appear
  enrolledTeamIds.forEach(id => {
    table[id] = {
      teamId: id,
      teamName: teamMap[id] ?? `Team ${id}`,
      played: 0, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
    }
  })

  // Then seed from matches (covers teams not enrolled but in a match)
  matches.forEach(m => {
    [m.teamAId, m.teamBId].forEach(id => {
      if (!table[id]) {
        table[id] = {
          teamId: id,
          teamName: teamMap[id] ?? `Team ${id}`,
          played: 0, wins: 0, draws: 0, losses: 0,
          goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
        }
      }
    })
  })

  const completed = matches.filter(
    m => m.status === 'completed' && m.scoreA != null && m.scoreB != null
  )

  completed.forEach(m => {
    const a = table[m.teamAId]
    const b = table[m.teamBId]
    if (!a || !b) return
    const sA = m.scoreA as number
    const sB = m.scoreB as number
    a.played++; b.played++
    a.goalsFor += sA; a.goalsAgainst += sB
    b.goalsFor += sB; b.goalsAgainst += sA
    if (sA > sB)      { a.wins++; a.points += 3; b.losses++ }
    else if (sB > sA) { b.wins++; b.points += 3; a.losses++ }
    else              { a.draws++; a.points++; b.draws++; b.points++ }
  })

  Object.values(table).forEach(r => { r.goalDiff = r.goalsFor - r.goalsAgainst })

  return Object.values(table).sort((a, b) =>
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor ||
    a.teamName.localeCompare(b.teamName)
  )
}


export function calcStandings_tour(
  matches: { teamAId: number | null; teamBId: number | null; scoreA: number | null; scoreB: number | null; status: string; }[],
  teamMap: Record<number, string>,
  enrolledTeamIds: number[] = []
): Standing[] {
  const table: Record<number, Standing> = {}

    // Seed from enrolled teams first — ensures 0-match teams appear
  enrolledTeamIds.forEach(id => {
    table[id] = {
      teamId: id,
      teamName: teamMap[id] ?? `Team ${id}`,
      played: 0, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
    }
  })

  // Then seed from matches (covers teams not enrolled but in a match)
  matches.forEach(m => {
    [m.teamAId, m.teamBId].forEach(id => {
      if (id === null) return  // ← add this
      if (!table[id]) {
        table[id] = {
          teamId: id,
          teamName: teamMap[id] ?? `Team ${id}`,
          played: 0, wins: 0, draws: 0, losses: 0,
          goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
        }
      }
    })
  })

  const completed = matches.filter(
    m => m.status === 'completed' && m.scoreA != null && m.scoreB != null
  )

  completed.forEach(m => {
    if (m.teamAId === null || m.teamBId === null) return  // ← add this
    const a = table[m.teamAId]
    const b = table[m.teamBId]
    if (!a || !b) return
    const sA = m.scoreA as number
    const sB = m.scoreB as number
    a.played++; b.played++
    a.goalsFor += sA; a.goalsAgainst += sB
    b.goalsFor += sB; b.goalsAgainst += sA
    if (sA > sB)      { a.wins++; a.points += 3; b.losses++ }
    else if (sB > sA) { b.wins++; b.points += 3; a.losses++ }
    else              { a.draws++; a.points++; b.draws++; b.points++ }
  })

  Object.values(table).forEach(r => { r.goalDiff = r.goalsFor - r.goalsAgainst })

  return Object.values(table).sort((a, b) =>
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor ||
    a.teamName.localeCompare(b.teamName)
  )
}


export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

// ↓ add these two

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}