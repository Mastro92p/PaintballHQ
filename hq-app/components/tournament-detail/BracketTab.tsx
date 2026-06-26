"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match, Team } from "@/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type Props = {
  matches: Match[];
  enrolledTeams: Team[];
  hasBracketMatches: boolean;
  generatingBracket: boolean;
  resettingBracket: boolean;
  bracketError: string | null;
  savingBracketMatch: number | null;
  bracketScores: Record<number, { scoreA: string; scoreB: string }>;
  onGenerateBracket: () => void;
  onResetBracket: () => void;
  onScoreChange: (matchId: number, field: "scoreA" | "scoreB", value: string) => void;
  onSaveBracketScore: (matchId: number) => void;

  editingBracketMatch: Match | null;
  bracketEditSaving: boolean;
  onOpenBracketEdit: (match: Match) => void;
  onCloseBracketEdit: () => void;
  onSaveBracketEdit: (matchId: number, teamAId: number | null, teamBId: number | null) => void;
};

const PHASE_ORDER: Record<string, number> = {
  round_of_32: 1,
  round_of_16: 2,
  quarter_final: 3,
  semi_final: 4,
  final: 5,
};

export function BracketTab({
  matches,
  enrolledTeams,
  hasBracketMatches,
  generatingBracket,
  resettingBracket,
  bracketError,
  savingBracketMatch,
  bracketScores,
  onGenerateBracket,
  onResetBracket,
  onScoreChange,
  onSaveBracketScore,
  editingBracketMatch,
  bracketEditSaving,
  onOpenBracketEdit,
  onCloseBracketEdit,
  onSaveBracketEdit,
}: Props) {
  const bracketMatches = matches.filter((m) => m.phase && m.phase !== "group");

  const qualifiedTeams = useMemo(() => {
    const seen = new Map<number, Team>();
    for (const team of enrolledTeams) seen.set(team.id, team);
    return Array.from(seen.values());
  }, [enrolledTeams]);

  const [editTeamAId, setEditTeamAId] = useState<string>("");
  const [editTeamBId, setEditTeamBId] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingBracketMatch) {
      setEditTeamAId("");
      setEditTeamBId("");
      setEditError(null);
      return;
    }

    setEditTeamAId(
      editingBracketMatch.teamAId != null ? String(editingBracketMatch.teamAId) : ""
    );
    setEditTeamBId(
      editingBracketMatch.teamBId != null ? String(editingBracketMatch.teamBId) : ""
    );
    setEditError(null);
  }, [editingBracketMatch]);

  function handleSaveEdit() {
    if (!editingBracketMatch) return;

    const teamAId = editTeamAId ? Number(editTeamAId) : null;
    const teamBId = editTeamBId ? Number(editTeamBId) : null;

    if (teamAId != null && teamBId != null && teamAId === teamBId) {
      setEditError("Team A and Team B must be different.");
      return;
    }

    setEditError(null);
    onSaveBracketEdit(editingBracketMatch.id, teamAId, teamBId);
  }

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
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
          {bracketError}
        </div>
      )}

      {!hasBracketMatches ? (
        <div className="text-center py-10 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
          <p className="text-2xl mb-2">🏆</p>
          <p className="font-medium">No bracket yet</p>
          <p className="text-sm mt-1">
            Generate the bracket to start the knockout stage
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-8 pb-4" style={{ minWidth: "max-content" }}>
            {Array.from(new Set(bracketMatches.map((m) => m.phase)))
              .sort((a, b) => (PHASE_ORDER[a] ?? 0) - (PHASE_ORDER[b] ?? 0))
              .map((phase) => (
                <div key={phase} className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 text-center">
                    {phase.replace(/_/g, " ")}
                  </h3>

                  <div className="flex flex-col gap-3">
                    {bracketMatches
                      .filter((m) => m.phase === phase)
                      .sort((a, b) => a.id - b.id)
                      .map((m) => {
                        const scores = bracketScores[m.id] ?? { scoreA: "", scoreB: "" };
                        const aWins =
                          m.status === "completed" && (m.scoreA ?? 0) > (m.scoreB ?? 0);
                        const bWins =
                          m.status === "completed" && (m.scoreB ?? 0) > (m.scoreA ?? 0);

                        return (
                          <div
                            key={m.id}
                            className="w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
                          >
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                Match #{m.id}
                              </span>
                              <button
                                onClick={() => onOpenBracketEdit(m)}
                                className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors"
                              >
                                Edit
                              </button>
                            </div>

                            <div
                              className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700 ${
                                aWins ? "bg-green-50 dark:bg-green-900/20" : ""
                              }`}
                            >
                              <span
                                className={`flex-1 text-sm font-medium truncate ${
                                  aWins
                                    ? "text-green-600 dark:text-green-400 font-bold"
                                    : "text-gray-800 dark:text-gray-200"
                                }`}
                              >
                                {m.teamA?.name ?? "TBD"}
                              </span>
                              <input
                                type="number"
                                min="0"
                                placeholder="—"
                                value={
                                  scores.scoreA !== ""
                                    ? scores.scoreA
                                    : m.scoreA != null
                                    ? String(m.scoreA)
                                    : ""
                                }
                                onChange={(e) =>
                                  onScoreChange(m.id, "scoreA", e.target.value)
                                }
                                className="w-12 text-center text-sm font-bold tabular-nums rounded border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 py-0.5"
                              />
                            </div>

                            <div
                              className={`flex items-center gap-2 px-3 py-2 ${
                                bWins ? "bg-green-50 dark:bg-green-900/20" : ""
                              }`}
                            >
                              <span
                                className={`flex-1 text-sm font-medium truncate ${
                                  bWins
                                    ? "text-green-600 dark:text-green-400 font-bold"
                                    : "text-gray-800 dark:text-gray-200"
                                }`}
                              >
                                {m.teamB?.name ?? "TBD"}
                              </span>
                              <input
                                type="number"
                                min="0"
                                placeholder="—"
                                value={
                                  scores.scoreB !== ""
                                    ? scores.scoreB
                                    : m.scoreB != null
                                    ? String(m.scoreB)
                                    : ""
                                }
                                onChange={(e) =>
                                  onScoreChange(m.id, "scoreB", e.target.value)
                                }
                                className="w-12 text-center text-sm font-bold tabular-nums rounded border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 py-0.5"
                              />
                            </div>

                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                              <button
                                onClick={() => onSaveBracketScore(m.id)}
                                disabled={savingBracketMatch === m.id}
                                className="w-full text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 disabled:opacity-50 transition-colors"
                              >
                                {savingBracketMatch === m.id ? "Saving…" : "Save score"}
                              </button>
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

      <Modal
        open={!!editingBracketMatch}
        onClose={onCloseBracketEdit}
        title="Edit Bracket Match"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Team A
            </label>
            <select
              value={editTeamAId}
              onChange={(e) => setEditTeamAId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <option value="">TBD</option>
              {qualifiedTeams.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  disabled={String(t.id) === editTeamBId}
                >
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Team B
            </label>
            <select
              value={editTeamBId}
              onChange={(e) => setEditTeamBId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <option value="">TBD</option>
              {qualifiedTeams.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  disabled={String(t.id) === editTeamAId}
                >
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {editError && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {editError}
            </div>
          )}

          <div className="text-xs text-gray-400">
            Changing teams here is useful for restoring historical brackets.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onCloseBracketEdit}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={bracketEditSaving}
              onClick={handleSaveEdit}
            >
              Save matchup
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}