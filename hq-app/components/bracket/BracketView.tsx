import type { BracketData, BracketMatch, BracketPhase } from "@/lib/calc-bracket";
import { PHASE_LABELS } from "@/lib/calc-bracket";

type Props = {
  bracket: BracketData;
};

function MatchSlot({ match }: { match: BracketMatch }) {
  const isCompleted = match.status === "completed";
  const isDone = isCompleted && match.winnerId !== null;

  const teamAWon = isDone && match.winnerId === match.teamAId;
  const teamBWon = isDone && match.winnerId === match.teamBId;
  const isTBD_A  = !match.teamAId;
  const isTBD_B  = !match.teamBId;

  return (
    <div className="w-52 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      {/* Team A */}
      <div className={`flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800
        ${teamAWon ? "bg-teal-50 dark:bg-teal-900/20" : ""}
        ${isTBD_A  ? "opacity-40" : ""}
      `}>
        <span className={`text-sm truncate max-w-[120px]
          ${teamAWon
            ? "font-semibold text-teal-700 dark:text-teal-400"
            : "text-gray-700 dark:text-gray-300"}
          ${isTBD_A ? "italic text-gray-400 dark:text-gray-500" : ""}
        `}>
          {match.teamAName}
        </span>
        <span className={`text-sm tabular-nums font-bold ml-2 shrink-0
          ${teamAWon ? "text-teal-700 dark:text-teal-400" : "text-gray-400 dark:text-gray-500"}
        `}>
          {match.scoreA ?? "—"}
        </span>
      </div>

      {/* Team B */}
      <div className={`flex items-center justify-between px-3 py-2
        ${teamBWon ? "bg-teal-50 dark:bg-teal-900/20" : ""}
        ${isTBD_B  ? "opacity-40" : ""}
      `}>
        <span className={`text-sm truncate max-w-[120px]
          ${teamBWon
            ? "font-semibold text-teal-700 dark:text-teal-400"
            : "text-gray-700 dark:text-gray-300"}
          ${isTBD_B ? "italic text-gray-400 dark:text-gray-500" : ""}
        `}>
          {match.teamBName}
        </span>
        <span className={`text-sm tabular-nums font-bold ml-2 shrink-0
          ${teamBWon ? "text-teal-700 dark:text-teal-400" : "text-gray-400 dark:text-gray-500"}
        `}>
          {match.scoreB ?? "—"}
        </span>
      </div>
    </div>
  );
}

function PhaseColumn({
  phase,
  matches,
  totalSlots,
}: {
  phase: BracketPhase;
  matches: BracketMatch[];
  totalSlots: number;
}) {
  // Pad with empty slots so vertical spacing aligns across phases
  const slots: (BracketMatch | null)[] = Array.from({ length: totalSlots }, (_, i) =>
    matches[i] ?? null
  );

  return (
    <div className="flex flex-col items-center gap-2 min-w-[220px]">
      {/* Phase label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 whitespace-nowrap">
        {PHASE_LABELS[phase]}
      </p>

      {/* Slots evenly distributed */}
      <div
        className="flex flex-col w-full"
        style={{ gap: `${Math.max(12, 48 / totalSlots)}px` }}
      >
        {slots.map((match, idx) =>
          match ? (
            <MatchSlot key={match.id} match={match} />
          ) : (
            <div
              key={`empty-${idx}`}
              className="w-52 h-[72px] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 opacity-40"
            />
          )
        )}
      </div>
    </div>
  );
}

export function BracketView({ bracket }: Props) {
  const { phases, matchesByPhase } = bracket;

  if (phases.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <p className="text-4xl mb-3">🏆</p>
        <p className="text-lg font-medium">Bracket not generated yet</p>
        <p className="text-sm mt-1">The bracket will appear once the group stage is complete</p>
      </div>
    );
  }

  // Max slots = number of matches in the first (widest) phase
  const maxSlots = matchesByPhase[phases[0]]?.length ?? 1;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start gap-6 min-w-max px-1 pt-1">
        {phases.map((phase, colIdx) => {
          // Each subsequent phase has half the matches
          const slotCount = Math.max(1, Math.ceil(maxSlots / Math.pow(2, colIdx)));
          return (
            <PhaseColumn
              key={phase}
              phase={phase}
              matches={matchesByPhase[phase] ?? []}
              totalSlots={slotCount}
            />
          );
        })}
      </div>
    </div>
  );
}