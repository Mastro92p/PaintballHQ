"use client";

import type { Match, Team } from "@/types";
import { Button } from "@/components/ui/Button";
import { BracketMatchEditModal } from "@/components/tournament-detail/BracketMatchEditModal";

type Props = {
  matches: Match[];
  enrolledTeams: Team[];
  hasBracketMatches: boolean;
  generatingBracket: boolean;
  resettingBracket: boolean;
  bracketError: string | null;
  onGenerateBracket: () => void;
  onResetBracket: () => void;

  editingBracketMatch: Match | null;
  bracketEditSaving: boolean;
  onOpenBracketEdit: (match: Match) => void;
  onCloseBracketEdit: () => void;
  onSaveBracketEdit: (
    matchId: number,
    teamAId: number | null,
    teamBId: number | null,
    scoreA: number | null,
    scoreB: number | null
  ) => void;
};

const PHASE_ORDER: Record<string, number> = {
  round_of_32: 1,
  round_of_16: 2,
  quarter_final: 3,
  semi_final: 4,
  final: 5,
  third_place: 6,
};

function formatPhaseLabel(phase: string) {
  return phase.replace(/_/g, " ");
}

export function BracketTab({
  matches,
  enrolledTeams,
  hasBracketMatches,
  generatingBracket,
  resettingBracket,
  bracketError,
  onGenerateBracket,
  onResetBracket,
  editingBracketMatch,
  bracketEditSaving,
  onOpenBracketEdit,
  onCloseBracketEdit,
  onSaveBracketEdit,
}: Props) {
  const bracketMatches = matches.filter((m) => m.phase && m.phase !== "group");

  const phases = Array.from(new Set(bracketMatches.map((m) => m.phase).filter(Boolean) as string[]))
    .sort((a, b) => (PHASE_ORDER[a] ?? 0) - (PHASE_ORDER[b] ?? 0));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Bracket
        </h2>

        <div className="flex items-center gap-2">
          {hasBracketMatches && (
            <Button
              size="sm"
              variant="danger"
              loading={resettingBracket}
              onClick={onResetBracket}
            >
              🗑 Reset Bracket
            </Button>
          )}

          <Button
            size="sm"
            loading={generatingBracket}
            disabled={generatingBracket || hasBracketMatches}
            title={
              hasBracketMatches
                ? "Reset the bracket first"
                : enrolledTeams.length < 2
                ? "Enroll at least 2 teams first"
                : ""
            }
            onClick={onGenerateBracket}
          >
            ⚡ Generate Bracket
          </Button>
        </div>
      </div>

      {bracketError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-800 dark:bg-red-900/20">
          {bracketError}
        </div>
      )}

      {!hasBracketMatches ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-gray-400 dark:border-gray-700">
          <p className="mb-2 text-2xl">🏆</p>
          <p className="font-medium">No bracket yet</p>
          <p className="mt-1 text-sm">
            Generate the bracket to start the knockout stage
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-8 pb-4" style={{ minWidth: "max-content" }}>
            {phases.map((phase) => (
              <div key={phase} className="flex flex-col gap-4">
                <h3 className="text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                  {formatPhaseLabel(phase)}
                </h3>

                <div className="flex flex-col gap-3">
                  {bracketMatches
                    .filter((m) => m.phase === phase)
                    .sort((a, b) => a.id - b.id)
                    .map((m) => {
                      const aWins =
                        m.status === "completed" && (m.scoreA ?? 0) > (m.scoreB ?? 0);
                      const bWins =
                        m.status === "completed" && (m.scoreB ?? 0) > (m.scoreA ?? 0);

                      return (
                        <div
                          key={m.id}
                          className="w-56 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                        >
                          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                              Match #{m.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenBracketEdit(m)}
                              className="text-xs font-medium text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400"
                            >
                              Edit
                            </button>
                          </div>

                          <div
                            className={`flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-700 ${
                              aWins ? "bg-green-50 dark:bg-green-900/20" : ""
                            }`}
                          >
                            <span
                              className={`flex-1 truncate text-sm font-medium ${
                                aWins
                                  ? "font-bold text-green-600 dark:text-green-400"
                                  : "text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {m.teamA?.name ?? "TBD"}
                            </span>
                            <span className="w-12 text-center text-sm font-bold tabular-nums text-gray-700 dark:text-gray-200">
                              {m.scoreA ?? "—"}
                            </span>
                          </div>

                          <div
                            className={`flex items-center gap-2 px-3 py-2 ${
                              bWins ? "bg-green-50 dark:bg-green-900/20" : ""
                            }`}
                          >
                            <span
                              className={`flex-1 truncate text-sm font-medium ${
                                bWins
                                  ? "font-bold text-green-600 dark:text-green-400"
                                  : "text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {m.teamB?.name ?? "TBD"}
                            </span>
                            <span className="w-12 text-center text-sm font-bold tabular-nums text-gray-700 dark:text-gray-200">
                              {m.scoreB ?? "—"}
                            </span>
                          </div>

                          <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                            <div className="text-[11px] font-medium uppercase tracking-wide">
                              <span
                                className={
                                  m.status === "completed"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-gray-400"
                                }
                              >
                                {m.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BracketMatchEditModal
        open={!!editingBracketMatch}
        match={editingBracketMatch}
        teams={enrolledTeams}
        loading={bracketEditSaving}
        onClose={onCloseBracketEdit}
        onSave={onSaveBracketEdit}
      />
    </section>
  );
}