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
      if (id == null) return
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

  const completed = matches.filter((m): m is Match & { teamAId: number; teamBId: number; scoreA: number; scoreB: number } =>
    m.status === 'completed' && m.scoreA != null && m.scoreB != null && m.teamAId != null && m.teamBId != null
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

  const completed = matches.filter((m): m is { teamAId: number; teamBId: number; scoreA: number; scoreB: number; status: string } =>
    m.status === 'completed' && m.scoreA != null && m.scoreB != null && m.teamAId != null && m.teamBId != null
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


export function getClassicMatchResult(
  scoreA: number | null,
  scoreB: number | null,
  bodyCountA: number | null,
  bodyCountB: number | null
): {
  winner: "A" | "B" | "draw" | null;
  pointsA: number;
  pointsB: number;
  bodyCountA: number;
  bodyCountB: number;
} {
  const aliveA = bodyCountA ?? 0;
  const aliveB = bodyCountB ?? 0;

  if (scoreA == null || scoreB == null) {
    return { winner: null, pointsA: 0, pointsB: 0, bodyCountA: aliveA, bodyCountB: aliveB };
  }

  let winner: "A" | "B" | "draw";
  let basePointsA = 0;
  let basePointsB = 0;

  if (scoreA > scoreB) {
    winner = "A";
    basePointsA = 3;
  } else if (scoreB > scoreA) {
    winner = "B";
    basePointsB = 3;
  } else {
    winner = "draw";
    basePointsA = 1;
    basePointsB = 1;
  }

  return {
    winner,
    pointsA: basePointsA + aliveA,
    pointsB: basePointsB + aliveB,
    bodyCountA: aliveA,
    bodyCountB: aliveB,
  };
}