"use client";

import { useState, useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { ScoreInput } from "@/components/matches/ScoreInput";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Match, Tournament, Team, CreateMatchBody } from "@/types";

type MatchWithTeams = Match & {
  teamA: Team;
  teamB: Team;
  tournament: Tournament;
};

type FormState = {
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  round: string;
  field: string;
};

const emptyForm: FormState = {
  tournamentId: "",
  teamAId: "",
  teamBId: "",
  round: "1",
  field: "",
};

export default function ManageMatchesPage() {
  const { data: matches, loading: matchesLoading, error: matchesError, refetch } =
    useFetch<MatchWithTeams[]>("/api/matches");
  const { data: tournaments } = useFetch<Tournament[]>("/api/tournaments");
  const { data: teams } = useFetch<Team[]>("/api/teams");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterTournament, setFilterTournament] = useState("");

  const filtered = useMemo(() => {
    if (!matches) return [];
    if (!filterTournament) return matches;
    return matches.filter((m) => String(m.tournamentId) === filterTournament);
  }, [matches, filterTournament]);

  const matchesByTournament = useMemo(() => {
    return filtered.reduce<Record<string, MatchWithTeams[]>>((acc, m) => {
      const key = String(m.tournamentId);
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});
  }, [filtered]);

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
  }

  async function handleCreate() {
    if (!form.tournamentId || !form.teamAId || !form.teamBId) return;
    if (form.teamAId === form.teamBId) {
      alert("Team A and Team B must be different");
      return;
    }

    setSaving(true);
    const body: CreateMatchBody = {
      tournamentId: Number(form.tournamentId),
      teamAId: Number(form.teamAId),
      teamBId: Number(form.teamBId),
      round: form.round ? Number(form.round) : undefined,
      field: form.field || undefined,
    };

    await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    closeModal();
    refetch();
  }

  async function handleSaveScore(
    matchId: number,
    scoreA: number,
    scoreB: number,
    round?: number
  ) {
    await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          scoreA,
          scoreB,
          ...(round != null ? { round } : {}),
        }),
    });
    refetch();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this match?")) return;
    await fetch(`/api/matches/${id}`, { method: "DELETE" });
    refetch();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Matches
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Schedule matches and enter scores
          </p>
        </div>
        <Button onClick={openCreate}>+ New Match</Button>
      </div>

      {/* Tournament filter */}
      {tournaments && tournaments.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterTournament("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterTournament === ""
                ? "bg-teal-700 text-white"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            All
          </button>
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterTournament(String(t.id))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterTournament === String(t.id)
                  ? "bg-teal-700 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {matchesLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {matchesError && (
        <p className="text-red-500 text-sm">{matchesError}</p>
      )}

      {/* Matches grouped by tournament */}
      {!matchesLoading && !matchesError && (
        <>
          {Object.keys(matchesByTournament).length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🎮</p>
              <p className="text-lg font-medium">No matches yet</p>
              <p className="text-sm mt-1">Create your first match to get started</p>
            </div>
          ) : (
            Object.entries(matchesByTournament).map(([tournamentId, tMatches]) => {
              const tournament = tournaments?.find((t) => String(t.id) === tournamentId);
              return (
                <section key={tournamentId} className="space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {tournament?.name ?? `Tournament ${tournamentId}`}
                  </h2>
                  <div className="space-y-2">
                    {tMatches
                      .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
                      .map((m) => (
                        <div
                          key={m.id}
                          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          {/* Match info */}
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {m.round && (
                                <span className="text-xs text-gray-400 uppercase tracking-wide">
                                  Round {m.round}
                                </span>
                              )}
                              {m.field && (
                                <span className="text-xs text-gray-400">
                                  · {m.field}
                                </span>
                              )}
                              <Badge variant={m.status === "completed" ? "success" : "muted"}>
                                {m.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {m.teamA?.name ?? `Team ${m.teamAId}`}
                              <span className="text-gray-400 mx-2">vs</span>
                              {m.teamB?.name ?? `Team ${m.teamBId}`}
                            </p>
                          </div>

                          {/* Score input + delete */}
                          <div className="flex items-center gap-3 shrink-0">
                            <ScoreInput match={m} onSave={handleSaveScore} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(m.id)}
                              className="text-red-400 hover:text-red-600"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              );
            })
          )}
        </>
      )}

      {/* Create match modal */}
      <Modal open={modalOpen} onClose={closeModal} title="New Match">
        <form
          onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tournament
            </label>
            <select
              required
              value={form.tournamentId}
              onChange={(e) => setForm({ ...form, tournamentId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="">Select tournament...</option>
              {tournaments?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Team A
              </label>
              <select
                required
                value={form.teamAId}
                onChange={(e) => setForm({ ...form, teamAId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">Select team...</option>
                {teams?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Team B
              </label>
              <select
                required
                value={form.teamBId}
                onChange={(e) => setForm({ ...form, teamBId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">Select team...</option>
                {teams?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Round
              </label>
              <input
                type="number"
                min={1}
                value={form.round}
                onChange={(e) => setForm({ ...form, round: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="1"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Field <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                value={form.field}
                onChange={(e) => setForm({ ...form, field: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="Field A"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create Match
            </Button>
          </div>
        </form>
      </Modal>

    </main>
  );
}