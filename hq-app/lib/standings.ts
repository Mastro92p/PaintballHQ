import type { Match } from "@/types";
import { getClassicMatchResult } from "@/lib/utils";

export type TournamentTeam = {
  teamId: number;
  team?: {
    id: number;
    name: string;
    logoUrl?: string | null;
  } | null;
};

export type StandingRow = {
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
  group: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  bodyCount?: number;
  groupRank?: number;
  overallRank?: number;
};

export type GroupedStandingsResult = {
  grouped: Record<string, StandingRow[]>;
  wildcardRows: StandingRow[];
};

type StandingsOptions = {
  useBodyCount?: boolean;
}

export function sortStandings(
  a: StandingRow,
  b: StandingRow,
  options: StandingsOptions = {}
) {
  return (
    b.points - a.points ||
    (options.useBodyCount ? (b.bodyCount ?? 0) - (a.bodyCount ?? 0) : 0) ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    a.ga - b.ga ||
    a.teamName.localeCompare(b.teamName)
  );
}

function buildTeamMap(teams: TournamentTeam[]) {
  const map: Record<number, { name: string; logoUrl: string | null }> = {};

  for (const tt of teams) {
    map[tt.teamId] = {
      name: tt.team?.name ?? `Team ${tt.teamId}`,
      logoUrl: tt.team?.logoUrl ?? null,
    };
  }

  return map;
}

function getOrCreateRow(
  rows: Record<number, StandingRow>,
  teamId: number,
  teamName: string,
  teamLogoUrl: string | null,
  group: string | null
) {
  if (!rows[teamId]) {
    rows[teamId] = {
      teamId,
      teamName,
      teamLogoUrl,
      group,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      bodyCount: 0,
    };
  }

  return rows[teamId];
}

function applyMatchToRows(
  rowA: StandingRow,
  rowB: StandingRow,
  scoreA: number,
  scoreB: number,
  bodyCountA: number | null | undefined,
  bodyCountB: number | null | undefined,
  options: StandingsOptions = {}
) {
  rowA.played += 1;
  rowB.played += 1;

  rowA.gf += scoreA;
  rowA.ga += scoreB;
  rowB.gf += scoreB;
  rowB.ga += scoreA;

  if (options.useBodyCount) {
    rowA.bodyCount = (rowA.bodyCount ?? 0) + (bodyCountA ?? 0);
    rowB.bodyCount = (rowB.bodyCount ?? 0) + (bodyCountB ?? 0);
  }

  if (scoreA > scoreB) {
    rowA.wins += 1;
    rowA.points += 3;
    rowB.losses += 1;
  } else if (scoreB > scoreA) {
    rowB.wins += 1;
    rowB.points += 3;
    rowA.losses += 1;
  } else {
    rowA.draws += 1;
    rowB.draws += 1;
    rowA.points += 1;
    rowB.points += 1;
  }
}

export function computeRoundRobinStandings(
  teams: TournamentTeam[],
  matches: Match[],
  options: StandingsOptions = {}
): StandingRow[] {
  const teamMap = buildTeamMap(teams);
  const rows: Record<number, StandingRow> = {};

  for (const tt of teams) {
    rows[tt.teamId] = {
      teamId: tt.teamId,
      teamName: teamMap[tt.teamId].name,
      teamLogoUrl: teamMap[tt.teamId].logoUrl,
      group: null,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      bodyCount: 0,
    };
  }

  for (const match of matches) {
    if (
      match.status !== "completed" ||
      match.teamAId == null ||
      match.teamBId == null ||
      match.scoreA == null ||
      match.scoreB == null
    ) {
      continue;
    }

    const rowA = rows[match.teamAId];
    const rowB = rows[match.teamBId];

    if (!rowA || !rowB) continue;

    applyMatchToRows(
      rowA,
      rowB,
      match.scoreA,
      match.scoreB,
      match.bodyCountA,
      match.bodyCountB,
      options
    );
  }

  return Object.values(rows)
    .map((row) => ({
      ...row,
      gd: row.gf - row.ga,
    }))
    .sort((a, b) => sortStandings(a, b, options))
    .map((row, index) => ({
      ...row,
      overallRank: index + 1,
    }));
}

// add to lib/standings.ts
export function applyClassicScoring(rows: StandingRow[], matches: Match[]): StandingRow[] {
  const overrides: Record<number, { wins: number; draws: number; losses: number; points: number; bodyCount: number }> = {};

  rows.forEach((row) => {
    overrides[row.teamId] = { wins: 0, draws: 0, losses: 0, points: 0, bodyCount: 0 };
  });

  matches.forEach((match) => {
    const completed =
      match.status === "completed" &&
      match.teamAId != null &&
      match.teamBId != null &&
      match.scoreA != null &&
      match.scoreB != null;

    if (!completed) return;

    const aId = match.teamAId!;
    const bId = match.teamBId!;
    if (!overrides[aId] || !overrides[bId]) return;

    const result = getClassicMatchResult(
      match.scoreA ?? null,
      match.scoreB ?? null,
      match.bodyCountA ?? null,
      match.bodyCountB ?? null
    );

    overrides[aId].points += result.pointsA;
    overrides[bId].points += result.pointsB;
    overrides[aId].bodyCount += result.bodyCountA;
    overrides[bId].bodyCount += result.bodyCountB;

    if (result.winner === "A") {
      overrides[aId].wins += 1;
      overrides[bId].losses += 1;
    } else if (result.winner === "B") {
      overrides[bId].wins += 1;
      overrides[aId].losses += 1;
    } else {
      overrides[aId].draws += 1;
      overrides[bId].draws += 1;
    }
  });

  const merged = rows.map((row) => ({
    ...row,
    wins: overrides[row.teamId].wins,
    draws: overrides[row.teamId].draws,
    losses: overrides[row.teamId].losses,
    points: overrides[row.teamId].points,
    bodyCount: overrides[row.teamId].bodyCount,
  }));

  merged.sort((a, b) =>
    sortStandings(a, b, { useBodyCount: true })
  );

  merged.forEach((row, index) => {
    row.overallRank = index + 1;
  });

  return merged;
}



export function computeGroupedStandings(
  teams: TournamentTeam[],
  matches: Match[],
  qualifiersPerGroup = 2,
  wildCardCount = 0,
  options: StandingsOptions = {}
): GroupedStandingsResult {
  const teamMap = buildTeamMap(teams);
  const rowsByGroup: Record<string, Record<number, StandingRow>> = {};

  const groupMatches = matches.filter(
    (match) =>
      match.phase === "group" &&
      !!match.group &&
      match.teamAId != null &&
      match.teamBId != null
  );

  for (const match of groupMatches) {
    const group = match.group?.name ?? "Ungrouped";

    if (!rowsByGroup[group]) {
      rowsByGroup[group] = {};
    }

    const rowA = getOrCreateRow(
      rowsByGroup[group],
      match.teamAId as number,
      teamMap[match.teamAId as number]?.name ?? `Team ${match.teamAId}`,
      teamMap[match.teamAId as number]?.logoUrl ?? null,
      group
    );

    const rowB = getOrCreateRow(
      rowsByGroup[group],
      match.teamBId as number,
      teamMap[match.teamBId as number]?.name ?? `Team ${match.teamBId}`,
      teamMap[match.teamBId as number]?.logoUrl ?? null,
      group
    );

    if (
      match.status !== "completed" ||
      match.scoreA == null ||
      match.scoreB == null
    ) {
      continue;
    }

    applyMatchToRows(
    rowA,
    rowB,
    match.scoreA,
    match.scoreB,
    match.bodyCountA,
    match.bodyCountB,
    options
  );
  }

  const grouped: Record<string, StandingRow[]> = {};

  for (const [group, groupRows] of Object.entries(rowsByGroup)) {
    grouped[group] = Object.values(groupRows)
      .map((row) => ({
        ...row,
        gd: row.gf - row.ga,
      }))
      .sort((a, b) => sortStandings(a, b, options))
      .map((row, index) => ({
        ...row,
        groupRank: index + 1,
      }));
  }

  const allRows = Object.values(grouped)
    .flat()
    .sort((a, b) => sortStandings(a, b, options))
    .map((row, index) => ({
      ...row,
      overallRank: index + 1,
    }));

  const overallRankMap = new Map<number, number>(
    allRows.map((row) => [row.teamId, row.overallRank ?? 0])
  );

  for (const group of Object.keys(grouped)) {
    grouped[group] = grouped[group].map((row) => ({
      ...row,
      overallRank: overallRankMap.get(row.teamId),
    }));
  }

  const wildcardRows = Object.values(grouped)
    .flat()
    .filter((row) => (row.groupRank ?? 999) > qualifiersPerGroup)
    .sort((a, b) => sortStandings(a, b, options))
    .slice(0, wildCardCount);

  return {
    grouped: Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    ),
    wildcardRows,
  };
}