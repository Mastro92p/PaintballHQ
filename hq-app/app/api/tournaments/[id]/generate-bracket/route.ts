import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Match } from "@/generated/prisma/browser";

type Params = { params: Promise<{ id: string }> };

const PHASE_ORDER: string[] = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "final",
];

const PHASE_BY_SIZE: Record<number, string> = {
  32: "round_of_32",
  16: "round_of_16",
  8: "quarter_final",
  4: "semi_final",
  2: "final",
};

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// ── DELETE — reset bracket ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tournamentId = parseInt(id, 10);
  if (isNaN(tournamentId)) return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });

  await prisma.match.deleteMany({
    where: { tournamentId, NOT: { phase: "group" } },
  });

  return new Response(null, { status: 204 });
}

// ── POST — generate bracket ────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tournamentId = parseInt(id, 10);
  if (isNaN(tournamentId)) return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { teams: { include: { team: true } }, matches: true },
  });

  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (tournament.type === "round_robin") {
    return NextResponse.json({ error: "Round robin tournaments do not have a bracket" }, { status: 400 });
  }

  const existingBracket = tournament.matches.filter((m) => m.phase !== "group");
  if (existingBracket.length > 0) {
    return NextResponse.json({ error: "Bracket already generated. Reset the bracket first." }, { status: 409 });
  }

  // ── Step 1: Determine seeded team list ────────────────────────────────────
  let seededTeamIds: number[] = [];
  const fc = (tournament.formatConfig ?? {}) as { thirdPlaceMatch?: boolean };
  const wantsThirdPlace = fc.thirdPlaceMatch === true;

  if (tournament.type === "group_and_bracket") {
    const fc = (tournament.formatConfig ?? {}) as {
      qualifiersPerGroup?: number;
      wildCardCount?: number;
    };

    const qualifiersPerGroup = fc.qualifiersPerGroup ?? 2;
    const wildCardCount = fc.wildCardCount ?? 0;

    const groupMatches = tournament.matches.filter(
      (m) => m.phase === "group" && m.group && m.teamAId !== null && m.teamBId !== null
    ) as unknown as Match[];

    if (groupMatches.length === 0) {
      return NextResponse.json({ error: "No group stage matches found." }, { status: 400 });
    }

    const teamMap: Record<number, string> = {};
    tournament.teams.forEach((tt) => { teamMap[tt.teamId] = tt.team?.name ?? `Team ${tt.teamId}`; });

    type StandingRow = {
      teamId: number; teamName: string; group: string;
      played: number; wins: number; draws: number; losses: number;
      gf: number; ga: number; gd: number; points: number; rank?: number;
    };

    const sortRows = (a: StandingRow, b: StandingRow) =>
      b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.ga - b.ga || a.teamId - b.teamId;

    function computeGroupStandings(groupLabel: string, matches: Match[]): StandingRow[] {
      const rows: Record<number, StandingRow> = {};
      const teamIds = new Set<number>();
      for (const m of matches) {
        if (m.teamAId != null) teamIds.add(m.teamAId);
        if (m.teamBId != null) teamIds.add(m.teamBId);
      }
      for (const teamId of teamIds) {
        rows[teamId] = { teamId, teamName: teamMap[teamId] ?? `Team ${teamId}`, group: groupLabel, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 };
      }
      for (const m of matches) {
        if (m.status !== "completed" || m.teamAId == null || m.teamBId == null || m.scoreA == null || m.scoreB == null) continue;
        const a = rows[m.teamAId];
        const b = rows[m.teamBId];
        if (!a || !b) continue;
        a.played++; b.played++;
        a.gf += m.scoreA; a.ga += m.scoreB;
        b.gf += m.scoreB; b.ga += m.scoreA;
        if (m.scoreA > m.scoreB) { a.wins++; a.points += 3; b.losses++; }
        else if (m.scoreB > m.scoreA) { b.wins++; b.points += 3; a.losses++; }
        else { a.draws++; b.draws++; a.points++; b.points++; }
      }
      return Object.values(rows).map((r) => ({ ...r, gd: r.gf - r.ga })).sort(sortRows).map((r, idx) => ({ ...r, rank: idx + 1 }));
    }

    const matchesByGroup = groupMatches.reduce<Record<string, Match[]>>((acc, m) => {
      const g = m.group as string;
      if (!acc[g]) acc[g] = [];
      acc[g].push(m);
      return acc;
    }, {});

    const groupLabels = Object.keys(matchesByGroup).sort();
    if (groupLabels.length === 0) return NextResponse.json({ error: "No valid groups found." }, { status: 400 });

    const directByRank: Record<number, StandingRow[]> = {};
    const wildcardCandidates: StandingRow[] = [];

    for (const groupLabel of groupLabels) {
      const standings = computeGroupStandings(groupLabel, matchesByGroup[groupLabel]);
      if (standings.length < qualifiersPerGroup) {
        return NextResponse.json({ error: `Group ${groupLabel} does not have enough teams to qualify ${qualifiersPerGroup} teams.` }, { status: 400 });
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

    Object.keys(directByRank).forEach((rank) => { directByRank[Number(rank)].sort(sortRows); });
    wildcardCandidates.sort(sortRows);

    const directQualifiers = Object.keys(directByRank).map(Number).sort((a, b) => a - b).flatMap((rank) => directByRank[rank]);
    const wildCards = wildcardCandidates.slice(0, wildCardCount);
    seededTeamIds = [...directQualifiers, ...wildCards].map((r) => r.teamId);

    if (seededTeamIds.length === 0) return NextResponse.json({ error: "No teams qualified for the bracket." }, { status: 400 });
  } else {
    seededTeamIds = tournament.teams.map((tt) => tt.teamId);
  }

  if (seededTeamIds.length < 2) {
    return NextResponse.json({ error: "At least 2 teams are required to generate a bracket" }, { status: 400 });
  }

  // ── Step 2: Build bracket with correct bye propagation ───────────────────
  const advanceCount = seededTeamIds.length;
  const bracketSize = nextPowerOf2(advanceCount);
  const byeCount = bracketSize - advanceCount;

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

  // Standard recursive bracket seeding: seed 1 and 2 on opposite halves
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

  const positions = buildBracketPositions(bracketSize);
  const paddedSeeds: (number | null)[] = [
    ...seededTeamIds,
    ...Array(bracketSize - advanceCount).fill(null),
  ];
  // bracketSlots[i] = teamId or null (bye placeholder)
  const bracketSlots: (number | null)[] = positions.map(
    (seedNum) => paddedSeeds[seedNum - 1] ?? null
  );

  // ── Pre-resolve all byes in R16 → produce QF slots ─────────────────────────
  // Instead of running byes through the phase loop (which shifts phase labels),
  // we resolve the first round byes ahead of time, producing:
  //   r16Matches: the real R16 matches to create in DB
  //   qfSlots: the 8 QF slots (bye teams already in place, R16 winners as null)

  let byeTeams = 0;

  // Slot pairs for the first round (R16 level, bracketSize slots → bracketSize/2 pairs)
  interface SlotPair {
    teamA: number | null;
    teamB: number | null;
  }

  const firstRoundPairs: SlotPair[] = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    firstRoundPairs.push({
      teamA: bracketSlots[i * 2],
      teamB: bracketSlots[i * 2 + 1],
    });
  }

  // Each pair of R16 matches feeds one QF slot
  // pair 0+1 → QF match 0,  pair 2+3 → QF match 1, etc.
  const r16Matches: {
      pairIndex: number;
      teamAId: number | null;
      teamBId: number | null;
  }[] = [];
  // qfSlots: one entry per QF match, top and bottom slot
  const qfSlotTop: (number | null)[] = Array(bracketSize / 4).fill(null);
  const qfSlotBot: (number | null)[] = Array(bracketSize / 4).fill(null);

  for (let i = 0; i < firstRoundPairs.length; i++) {
    const { teamA, teamB } = firstRoundPairs[i];
    const qfMatchIdx = Math.floor(i / 2);
    const isTop = i % 2 === 0;

    const isBye =
      (teamA !== null && teamB === null) ||
      (teamA === null && teamB !== null);

    if (isBye) {
      byeTeams++;
      const byeTeamId = teamA ?? teamB;
      if (isTop) qfSlotTop[qfMatchIdx] = byeTeamId;
      else qfSlotBot[qfMatchIdx] = byeTeamId;
    } else {
      // Real R16 match — winner slot stays null (TBD)
      r16Matches.push({
        pairIndex: i,
        teamAId: teamA,
        teamBId: teamB,
      });
      // QF slot stays null (filled when R16 winner is known)
    }
  }

  // ── Build all match records ─────────────────────────────────────────────────
  const allMatchData: {
    tournamentId: number;
    teamAId: number | null;
    teamBId: number | null;
    phase: string;
    round: number;
    status: string;
    bracketOrder: number | null;
    nextMatchOrder: number | null;
    nextSlot: string | null;
  }[] = [];

  // 1. R16 real matches (only if bracketSize === 16 and there are non-bye pairs)
  if (r16Matches.length > 0) {
    for (const m of r16Matches) {
      allMatchData.push({
        tournamentId,
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        phase: firstPhase,
        round: 1,
        status: "pending",
        bracketOrder: m.pairIndex,
        nextMatchOrder: Math.floor(m.pairIndex / 2),
        nextSlot: m.pairIndex % 2 === 0 ? "teamAId" : "teamBId",
      });
    }
  }

  // 2. QF matches — always bracketSize/4 of them
  const qfPhase = PHASE_BY_SIZE[bracketSize / 2]; // e.g. for bracketSize=16 → "quarter_final"
  if (qfPhase) {
    for (let i = 0; i < bracketSize / 4; i++) {
      allMatchData.push({
        tournamentId,
        teamAId: qfSlotTop[i],
        teamBId: qfSlotBot[i],
        phase: qfPhase,
        round: 1,
        status: "pending",
        bracketOrder: i,
        nextMatchOrder: Math.floor(i / 2),
        nextSlot: i % 2 === 0 ? "teamAId" : "teamBId",
      });
    }
  }

  // 3. Remaining later rounds (SF, Final) — all TBD
  const laterPhases = allPhases.filter(
    (p) => p !== firstPhase && p !== qfPhase
  );
  let matchCount = bracketSize / 8; // SF has bracketSize/8 matches
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
      });
    }
    matchCount = Math.max(1, Math.floor(matchCount / 2));
  }

  // Pass 1: create all matches and capture their ids
  const createdIds: Record<string, Record<number, number>> = {}

  try {
    for (const matchData of allMatchData) {
      const created = await prisma.match.create({ data: matchData as any })
      const phase = matchData.phase
      const order = matchData.bracketOrder ?? 0
      if (!createdIds[phase]) createdIds[phase] = {}
      createdIds[phase][order] = created.id
    }
  } catch (err) {
    console.error("match create failed:", JSON.stringify(err, null, 2))
    return NextResponse.json(
      { error: "DB insert failed", detail: String(err) },
      { status: 500 }
    )
  }

  // Pass 2: wire nextMatchId on every non-final match
  const nextPhaseMap: Record<string, string> = {
    round_of_32: "round_of_16",
    round_of_16: "quarter_final",
    quarter_final: "semi_final",
    semi_final: "final",
  }

  try {
    for (const matchData of allMatchData) {
      if (matchData.phase === "final" || matchData.nextMatchOrder == null) continue

      const nextPhase = nextPhaseMap[matchData.phase]
      if (!nextPhase) continue

      const sourceId = createdIds[matchData.phase]?.[matchData.bracketOrder ?? 0]
      const targetId = createdIds[nextPhase]?.[matchData.nextMatchOrder]

      if (!sourceId || !targetId) continue

      await prisma.match.update({
        where: { id: sourceId },
        data: { nextMatchId: targetId },
      })
    }
  } catch (err) {
    console.error("nextMatchId wiring failed:", JSON.stringify(err, null, 2))
    return NextResponse.json(
      { error: "DB wiring failed", detail: String(err) },
      { status: 500 }
    )
  }

  // Pass 3: optional third-place match, wired from the two semifinal losers
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
        } as any,
      });

      await prisma.match.update({
        where: { id: semiIds[0] },
        data: { loserNextMatchId: thirdPlace.id, loserNextSlot: "teamAId" },
      });

      await prisma.match.update({
        where: { id: semiIds[1] },
        data: { loserNextMatchId: thirdPlace.id, loserNextSlot: "teamBId" },
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
    byeTeams,
    bracketSize,
    firstPhase: allPhases[0],
    teamsSeeded: seededTeamIds.length,
    advanceCount,
    byeCount,
    phases: allPhases,
    seededTeamIds,
    thirdPlaceCreated,
  });
}