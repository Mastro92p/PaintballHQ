import type { Match } from "@/types";

export type BracketPhase =
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "final";

export type BracketMatch = {
  id: number;
  slot: number;
  teamAId: number | null;
  teamAName: string;
  teamBId: number | null;
  teamBName: string;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
  winnerId: number | null;
};

export type BracketData = {
  phases: BracketPhase[];
  matchesByPhase: Record<BracketPhase, BracketMatch[]>;
};

const PHASE_ORDER: BracketPhase[] = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "final",
];

const PHASE_LABELS: Record<BracketPhase, string> = {
  round_of_32:   "Round of 32",
  round_of_16:   "Round of 16",
  quarter_final: "Quarter Finals",
  semi_final:    "Semi Finals",
  final:         "Final",
};

export { PHASE_LABELS };

function getWinner(m: BracketMatch): number | null {
  if (m.status !== "completed") return null;
  if (m.scoreA == null || m.scoreB == null) return null;
  if (m.scoreA > m.scoreB) return m.teamAId;
  if (m.scoreB > m.scoreA) return m.teamBId;
  return null; // draw — shouldn't happen in knockout
}

export function calcBracket(
  matches: Match[],
  teamMap: Record<number, string>
): BracketData {
  // Only non-group matches
  const bracketMatches = matches.filter((m) => m.phase !== "group");

  // Group by phase
  const raw: Partial<Record<BracketPhase, Match[]>> = {};
  for (const m of bracketMatches) {
    const phase = m.phase as BracketPhase;
    if (!raw[phase]) raw[phase] = [];
    raw[phase]!.push(m);
  }

  // Determine which phases are present, in order
  const phases = PHASE_ORDER.filter((p) => (raw[p]?.length ?? 0) > 0);

  // Build BracketMatch per phase, sorted by id (insertion order = slot order)
  const matchesByPhase = {} as Record<BracketPhase, BracketMatch[]>;

  for (const phase of phases) {
    const sorted = [...(raw[phase] ?? [])].sort((a, b) => a.id - b.id);

    matchesByPhase[phase] = sorted.map((m, idx) => {
      const bm: BracketMatch = {
        id:       m.id,
        slot:     idx + 1,
        teamAId:  m.teamAId ?? null,
        teamAName: m.teamAId ? (teamMap[m.teamAId] ?? "TBD") : "TBD",
        teamBId:  m.teamBId ?? null,
        teamBName: m.teamBId ? (teamMap[m.teamBId] ?? "TBD") : "TBD",
        scoreA:   m.scoreA ?? null,
        scoreB:   m.scoreB ?? null,
        status:   m.status,
        winnerId: null,
      };
      bm.winnerId = getWinner(bm);
      return bm;
    });
  }

  return { phases, matchesByPhase };
}