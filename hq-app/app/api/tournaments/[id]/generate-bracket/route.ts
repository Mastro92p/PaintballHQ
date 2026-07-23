import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const PHASE_ORDER = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "final",
] as const;

const PHASE_BY_SIZE: Record<number, string> = {
  32: "round_of_32",
  16: "round_of_16",
  8: "quarter_final",
  4: "semi_final",
  2: "final",
};

type StandingRow = {
  teamId: number;
  teamName: string;
  groupId: number;
  groupName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  rank?: number;
};

type GroupMatchLike = {
  teamAId: number | null;
  teamBId: number | null;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
  groupId: number | null;
};

type PlacementMode = "auto" | "manual";

type InitialPair = {
  teamAId: number | null;
  teamBId: number | null;
  autoAdvanceTeamId: number | null;
};

type MatchCreateData = {
  tournamentId: number;
  teamAId: number | null;
  teamBId: number | null;
  phase: string;
  round: number;
  status: string;
  bracketOrder: number | null;
  nextMatchOrder: number | null;
  nextSlot: string | null;
  groupId?: number | null;
};

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function sortRows(a: StandingRow, b: StandingRow) {
  return (
    b.points - a.points ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    a.ga - b.ga ||
    a.teamId - b.teamId
  );
}

function computeGroupStandings(
  groupId: number,
  groupName: string,
  matches: GroupMatchLike[],
  teamMap: Record<number, string>
): StandingRow[] {
  const rows: Record<number, StandingRow> = {};
  const teamIds = new Set<number>();

  for (const m of matches) {
    if (m.teamAId != null) teamIds.add(m.teamAId);
    if (m.teamBId != null) teamIds.add(m.teamBId);
  }

  for (const teamId of teamIds) {
    rows[teamId] = {
      teamId,
      teamName: teamMap[teamId] ?? `Team ${teamId}`,
      groupId,
      groupName,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    };
  }

  for (const m of matches) {
    if (
      m.status !== "completed" ||
      m.teamAId == null ||
      m.teamBId == null ||
      m.scoreA == null ||
      m.scoreB == null
    ) {
      continue;
    }

    const a = rows[m.teamAId];
    const b = rows[m.teamBId];
    if (!a || !b) continue;

    a.played++;
    b.played++;

    a.gf += m.scoreA;
    a.ga += m.scoreB;
    b.gf += m.scoreB;
    b.ga += m.scoreA;

    if (m.scoreA > m.scoreB) {
      a.wins++;
      a.points += 3;
      b.losses++;
    } else if (m.scoreB > m.scoreA) {
      b.wins++;
      b.points += 3;
      a.losses++;
    } else {
      a.draws++;
      b.draws++;
      a.points++;
      b.points++;
    }
  }

  return Object.values(rows)
    .map((r) => ({ ...r, gd: r.gf - r.ga }))
    .sort(sortRows)
    .map((r, idx) => ({ ...r, rank: idx + 1 }));
}

function buildBracketPositions(size: number): number[] {
  if (size === 2) return [1, 2];

  const half = buildBracketPositions(size / 2);
  const result: number[] = [];

  for (const seed of half) {
    result.push(seed);
    result.push(size + 1 - seed);
  }

  return result;
}

async function getAutoSeededTeamIds(tournament: any): Promise<number[]> {
  const fc = (tournament.formatConfig ?? {}) as {
    qualifiersPerGroup?: number;
    wildCardCount?: number;
  };

  if (tournament.type === "group_and_bracket") {
    const qualifiersPerGroup = fc.qualifiersPerGroup ?? 2;
    const wildCardCount = fc.wildCardCount ?? 0;

    const groupMatches: GroupMatchLike[] = tournament.matches.filter(
      (m: any) =>
        m.phase === "group" &&
        m.groupId != null &&
        m.teamAId != null &&
        m.teamBId != null
    );

    if (groupMatches.length === 0) {
      throw new Error("No group stage matches found.");
    }

    const teamMap: Record<number, string> = {};
    tournament.teams.forEach((tt: any) => {
      teamMap[tt.teamId] = tt.team?.name ?? `Team ${tt.teamId}`;
    });

    const matchesByGroup = groupMatches.reduce(
      (acc, m) => {
        if (m.groupId == null) return acc;
        if (!acc[m.groupId]) acc[m.groupId] = [];
        acc[m.groupId].push(m);
        return acc;
      },
      {} as Record<number, GroupMatchLike[]>
    );

    const validGroups = tournament.groups.filter(
      (group: any) => matchesByGroup[group.id]?.length > 0
    );

    if (validGroups.length === 0) {
      throw new Error("No valid groups found.");
    }

    const directByRank: Record<number, StandingRow[]> = {};
    const wildcardCandidates: StandingRow[] = [];

    for (const group of validGroups) {
      const standings = computeGroupStandings(
        group.id,
        group.name,
        matchesByGroup[group.id] ?? [],
        teamMap
      );

      if (standings.length < qualifiersPerGroup) {
        throw new Error(
          `Group ${group.name} does not have enough teams to qualify ${qualifiersPerGroup} teams.`
        );
      }

      standings.forEach((row, idx) => {
        if (idx < qualifiersPerGroup) {
          const rank = idx + 1;
          if (!directByRank[rank]) directByRank[rank] = [];
          directByRank[rank].push(row);
        } else {
          wildcardCandidates.push(row);
        }
      });
    }

    Object.keys(directByRank).forEach((rank) => {
      directByRank[Number(rank)].sort(sortRows);
    });

    wildcardCandidates.sort(sortRows);

    const directQualifiers = Object.keys(directByRank)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap((rank) => directByRank[rank]);

    const wildCards = wildcardCandidates.slice(0, wildCardCount);

    return [...directQualifiers, ...wildCards].map((r) => r.teamId);
  }

  return tournament.teams.map((tt: any) => tt.teamId);
}

function getBracketSize(
  tournament: any,
  placementMode: PlacementMode,
  seededTeamIds: number[]
): number {
  if (placementMode === "auto") {
    if (seededTeamIds.length < 2) {
      throw new Error("At least 2 teams are required to generate a bracket");
    }
    return nextPowerOf2(seededTeamIds.length);
  }

  const fc = (tournament.formatConfig ?? {}) as {
    qualifiersPerGroup?: number;
    wildCardCount?: number;
  };

  let slotCount = 0;

  if (tournament.type === "group_and_bracket") {
    const qualifiersPerGroup = fc.qualifiersPerGroup ?? 2;
    const wildCardCount = fc.wildCardCount ?? 0;
    const groupCount = tournament.groups?.length ?? 0;

    slotCount =
      groupCount > 0
        ? groupCount * qualifiersPerGroup + wildCardCount
        : tournament.teams.length;
  } else {
    slotCount = tournament.teams.length;
  }

  if (slotCount < 2) {
    throw new Error("At least 2 teams are required to generate a bracket");
  }

  return nextPowerOf2(slotCount);
}

function buildInitialPairs(
  bracketSize: number,
  placementMode: PlacementMode,
  seededTeamIds: number[]
): InitialPair[] {
  if (placementMode === "manual") {
    return Array.from({ length: bracketSize / 2 }, () => ({
      teamAId: null,
      teamBId: null,
      autoAdvanceTeamId: null,
    }));
  }

  const positions = buildBracketPositions(bracketSize);
  const paddedSeeds: (number | null)[] = [
    ...seededTeamIds,
    ...Array(bracketSize - seededTeamIds.length).fill(null),
  ];

  const bracketSlots: (number | null)[] = positions.map(
    (seedNum) => paddedSeeds[seedNum - 1] ?? null
  );

  const pairs: InitialPair[] = [];

  for (let i = 0; i < bracketSize / 2; i++) {
    const teamAId = bracketSlots[i * 2];
    const teamBId = bracketSlots[i * 2 + 1];

    const isBye =
      (teamAId !== null && teamBId === null) ||
      (teamAId === null && teamBId !== null);

    pairs.push({
      teamAId: isBye ? null : teamAId,
      teamBId: isBye ? null : teamBId,
      autoAdvanceTeamId: isBye ? (teamAId ?? teamBId) : null,
    });
  }

  return pairs;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = parseInt(id, 10);

  if (isNaN(tournamentId)) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  await prisma.match.deleteMany({
    where: { tournamentId, NOT: { phase: "group" } },
  });

  return new Response(null, { status: 204 });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = parseInt(id, 10);

  if (isNaN(tournamentId)) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: {
        include: {
          team: true,
          groupLinks: {
            include: {
              group: true,
            },
          },
        },
      },
      groups: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
      matches: {
        include: {
          group: true,
        },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  if (tournament.type === "round_robin") {
    return NextResponse.json(
      { error: "Round robin tournaments do not have a bracket" },
      { status: 400 }
    );
  }

  const existingBracket = tournament.matches.filter((m) => m.phase !== "group");
  if (existingBracket.length > 0) {
    return NextResponse.json(
      { error: "Bracket already generated. Reset the bracket first." },
      { status: 409 }
    );
  }

  const placementMode: PlacementMode =
    tournament.managementMode === "manual" ? "manual" : "auto";

  const fc = (tournament.formatConfig ?? {}) as {
    thirdPlaceMatch?: boolean;
  };
  const wantsThirdPlace = fc.thirdPlaceMatch === true;

  let seededTeamIds: number[] = [];

  try {
    if (placementMode === "auto") {
      seededTeamIds = await getAutoSeededTeamIds(tournament);

      if (seededTeamIds.length === 0) {
        return NextResponse.json(
          { error: "No teams qualified for the bracket." },
          { status: 400 }
        );
      }
    }
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to determine bracket teams.",
      },
      { status: 400 }
    );
  }

  let bracketSize: number;

  try {
    bracketSize = getBracketSize(tournament, placementMode, seededTeamIds);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Invalid bracket size.",
      },
      { status: 400 }
    );
  }

  const firstPhase = PHASE_BY_SIZE[bracketSize];
  if (!firstPhase) {
    return NextResponse.json(
      { error: `Unsupported bracket size: ${bracketSize} (max 32 teams)` },
      { status: 400 }
    );
  }

  const allPhases = PHASE_ORDER.filter((p) => {
    const entry = Object.entries(PHASE_BY_SIZE).find(([, v]) => v === p);
    return entry !== undefined && Number(entry[0]) <= bracketSize;
  });

  const initialPairs = buildInitialPairs(bracketSize, placementMode, seededTeamIds);

  const allMatchData: MatchCreateData[] = [];

  const nextRoundPhase = PHASE_BY_SIZE[bracketSize / 2];

  const nextRoundTop: (number | null)[] =
    nextRoundPhase && placementMode === "auto"
      ? Array(bracketSize / 4).fill(null)
      : [];

  const nextRoundBot: (number | null)[] =
    nextRoundPhase && placementMode === "auto"
      ? Array(bracketSize / 4).fill(null)
      : [];

  for (let i = 0; i < initialPairs.length; i++) {
    const pair = initialPairs[i];

    if (placementMode === "auto" && pair.autoAdvanceTeamId != null && nextRoundPhase) {
      const nextIdx = Math.floor(i / 2);
      const isTop = i % 2 === 0;

      if (isTop) nextRoundTop[nextIdx] = pair.autoAdvanceTeamId;
      else nextRoundBot[nextIdx] = pair.autoAdvanceTeamId;

      continue;
    }

    allMatchData.push({
      tournamentId,
      teamAId: pair.teamAId,
      teamBId: pair.teamBId,
      phase: firstPhase,
      round: 1,
      status: "pending",
      bracketOrder: i,
      nextMatchOrder: Math.floor(i / 2),
      nextSlot: i % 2 === 0 ? "teamAId" : "teamBId",
      groupId: null,
    });
  }

  if (nextRoundPhase) {
    for (let i = 0; i < bracketSize / 4; i++) {
      allMatchData.push({
        tournamentId,
        teamAId: placementMode === "auto" ? nextRoundTop[i] : null,
        teamBId: placementMode === "auto" ? nextRoundBot[i] : null,
        phase: nextRoundPhase,
        round: 1,
        status: "pending",
        bracketOrder: i,
        nextMatchOrder: Math.floor(i / 2),
        nextSlot: i % 2 === 0 ? "teamAId" : "teamBId",
        groupId: null,
      });
    }
  }

  const laterPhases = allPhases.filter(
    (p) => p !== firstPhase && p !== nextRoundPhase
  );

  let matchCount = bracketSize / 8;

  for (const phase of laterPhases) {
    for (let i = 0; i < matchCount; i++) {
      allMatchData.push({
        tournamentId,
        teamAId: null,
        teamBId: null,
        phase,
        round: 1,
        status: "pending",
        bracketOrder: i,
        nextMatchOrder: phase === "final" ? null : Math.floor(i / 2),
        nextSlot: phase === "final" ? null : i % 2 === 0 ? "teamAId" : "teamBId",
        groupId: null,
      });
    }

    matchCount = Math.max(1, Math.floor(matchCount / 2));
  }

  const createdIds: Record<string, Record<number, number>> = {};

  try {
    for (const matchData of allMatchData) {
      const created = await prisma.match.create({ data: matchData as any });
      const phase = matchData.phase;
      const order = matchData.bracketOrder ?? 0;

      if (!createdIds[phase]) createdIds[phase] = {};
      createdIds[phase][order] = created.id;
    }
  } catch (err) {
    console.error("match create failed:", JSON.stringify(err, null, 2));
    return NextResponse.json(
      { error: "DB insert failed", detail: String(err) },
      { status: 500 }
    );
  }

  const nextPhaseMap: Record<string, string> = {
    round_of_32: "round_of_16",
    round_of_16: "quarter_final",
    quarter_final: "semi_final",
    semi_final: "final",
  };

  try {
    for (const matchData of allMatchData) {
      if (matchData.phase === "final" || matchData.nextMatchOrder == null) continue;

      const nextPhase = nextPhaseMap[matchData.phase];
      if (!nextPhase) continue;

      const sourceId = createdIds[matchData.phase]?.[matchData.bracketOrder ?? 0];
      const targetId = createdIds[nextPhase]?.[matchData.nextMatchOrder];

      if (!sourceId || !targetId) continue;

      await prisma.match.update({
        where: { id: sourceId },
        data: { nextMatchId: targetId },
      });
    }
  } catch (err) {
    console.error("nextMatchId wiring failed:", JSON.stringify(err, null, 2));
    return NextResponse.json(
      { error: "DB wiring failed", detail: String(err) },
      { status: 500 }
    );
  }

  let thirdPlaceCreated = false;

  try {
    const semiIds = createdIds["semi_final"];

    if (wantsThirdPlace && semiIds && semiIds[0] && semiIds[1]) {
      const thirdPlace = await prisma.match.create({
        data: {
          tournamentId,
          teamAId: null,
          teamBId: null,
          phase: "third_place",
          round: 1,
          status: "pending",
          bracketOrder: 0,
          groupId: null,
        } as any,
      });

      await prisma.match.update({
        where: { id: semiIds[0] },
        data: {
          loserNextMatchId: thirdPlace.id,
          loserNextSlot: "teamAId",
        },
      });

      await prisma.match.update({
        where: { id: semiIds[1] },
        data: {
          loserNextMatchId: thirdPlace.id,
          loserNextSlot: "teamBId",
        },
      });

      thirdPlaceCreated = true;
    }
  } catch (err) {
    console.error("third place wiring failed:", JSON.stringify(err, null, 2));
    return NextResponse.json(
      { error: "Third place wiring failed", detail: String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    created: allMatchData.length + (thirdPlaceCreated ? 1 : 0),
    bracketSize,
    firstPhase: allPhases[0],
    placementMode,
    teamsSeeded: seededTeamIds.length,
    phases: allPhases,
    seededTeamIds,
    thirdPlaceCreated,
  });
}