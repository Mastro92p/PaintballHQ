"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import type { Match, Team } from "@/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type Props = {
  open: boolean;
  match: Match | null;
  teams: Team[];
  loading: boolean;
  onClose: () => void;
  onSave: (
    matchId: number,
    teamAId: number | null,
    teamBId: number | null,
    scoreA: number | null,
    scoreB: number | null
  ) => void;
};

const threeColGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  gap: "0.75rem",
  alignItems: "end",
};

function selectCls(hasError?: boolean) {
  return `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
    hasError
      ? "border-red-400 dark:border-red-500"
      : "border-gray-200 dark:border-gray-700"
  }`;
}

function inputCls(hasError?: boolean) {
  return `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
    hasError
      ? "border-red-400 dark:border-red-500"
      : "border-gray-200 dark:border-gray-700"
  }`;
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-xs text-red-500">{message}</p>;
}

export function BracketMatchEditModal({
  open,
  match,
  teams,
  loading,
  onClose,
  onSave,
}: Props) {
  const qualifiedTeams = useMemo(() => {
    const seen = new Map<number, Team>();
    for (const team of teams) seen.set(team.id, team);
    return Array.from(seen.values());
  }, [teams]);

  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!match) {
      setTeamAId("");
      setTeamBId("");
      setScoreA("");
      setScoreB("");
      setError(null);
      return;
    }

    setTeamAId(match.teamAId != null ? String(match.teamAId) : "");
    setTeamBId(match.teamBId != null ? String(match.teamBId) : "");
    setScoreA(match.scoreA != null ? String(match.scoreA) : "");
    setScoreB(match.scoreB != null ? String(match.scoreB) : "");
    setError(null);
  }, [match]);

  const nextTeamAId = teamAId ? Number(teamAId) : null;
  const nextTeamBId = teamBId ? Number(teamBId) : null;

  const teamsChanged =
    match != null &&
    ((match.teamAId ?? null) !== nextTeamAId ||
      (match.teamBId ?? null) !== nextTeamBId);

  function handleSwapTeams() {
    setTeamAId(teamBId);
    setTeamBId(teamAId);
    setScoreA(scoreB);
    setScoreB(scoreA);
    setError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!match) return;

    const parsedTeamAId = teamAId ? Number(teamAId) : null;
    const parsedTeamBId = teamBId ? Number(teamBId) : null;
    const parsedScoreA = scoreA === "" ? null : Number(scoreA);
    const parsedScoreB = scoreB === "" ? null : Number(scoreB);

    if (
      parsedTeamAId != null &&
      parsedTeamBId != null &&
      parsedTeamAId === parsedTeamBId
    ) {
      setError("Team A and Team B must be different.");
      return;
    }

    if (
      (parsedScoreA != null && Number.isNaN(parsedScoreA)) ||
      (parsedScoreB != null && Number.isNaN(parsedScoreB))
    ) {
      setError("Scores must be valid numbers.");
      return;
    }

    if ((parsedScoreA == null) !== (parsedScoreB == null)) {
      setError("Enter both scores or leave both empty.");
      return;
    }

    if (
      (parsedScoreA != null || parsedScoreB != null) &&
      (!parsedTeamAId || !parsedTeamBId)
    ) {
      setError("Both teams must be selected before saving scores.");
      return;
    }

    setError(null);
    onSave(match.id, parsedTeamAId, parsedTeamBId, parsedScoreA, parsedScoreB);
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Match" size="lg">
      <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div style={threeColGrid}>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Team A
              </label>
              <select
                value={teamAId}
                onChange={(e) => {
                  setTeamAId(e.target.value);
                  setError(null);
                }}
                className={selectCls(false)}
              >
                <option value="">Select team...</option>
                {qualifiedTeams.map((team) => (
                  <option
                    key={team.id}
                    value={team.id}
                    disabled={String(team.id) === teamBId}
                  >
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center pb-2">
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500">
                VS
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Team B
              </label>
              <select
                value={teamBId}
                onChange={(e) => {
                  setTeamBId(e.target.value);
                  setError(null);
                }}
                className={selectCls(false)}
              >
                <option value="">Select team...</option>
                {qualifiedTeams.map((team) => (
                  <option
                    key={team.id}
                    value={team.id}
                    disabled={String(team.id) === teamAId}
                  >
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwapTeams}
              className="text-xs font-medium text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400"
            >
              Swap teams
            </button>
          </div>

          <div style={threeColGrid}>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Score A{" "}
                <span className="font-normal normal-case tracking-normal text-gray-400">
                  (optional)
                </span>
              </label>
              <input
                type="number"
                min="0"
                value={scoreA}
                onChange={(e) => {
                  setScoreA(e.target.value);
                  setError(null);
                }}
                className={inputCls(false)}
                placeholder="—"
                disabled={teamsChanged}
              />
            </div>

            <div className="flex items-center justify-center pb-2">
              <span className="text-sm font-bold text-gray-300 dark:text-gray-600">
                –
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Score B{" "}
                <span className="font-normal normal-case tracking-normal text-gray-400">
                  (optional)
                </span>
              </label>
              <input
                type="number"
                min="0"
                value={scoreB}
                onChange={(e) => {
                  setScoreB(e.target.value);
                  setError(null);
                }}
                className={inputCls(false)}
                placeholder="—"
                disabled={teamsChanged}
              />
            </div>
          </div>

          {teamsChanged && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Scores will be cleared if you change the matchup.
            </p>
          )}

          <div className="border-t border-gray-100 dark:border-gray-700" />

          <FieldError message={error} />

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}