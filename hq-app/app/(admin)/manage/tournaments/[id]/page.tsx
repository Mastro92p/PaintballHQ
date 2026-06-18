"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import type { Tournament, Team, Match, CreateMatchBody } from "@/types";

type EnrolledTeam = { teamId: number; team: Team };

type TournamentDetail = Tournament & {
  teams: EnrolledTeam[];
  matches: Match[];
};

const statusVariant: Record<string, "default" | "success" | "warning" | "muted"> = {
  upcoming:  "warning",
  active:    "default",
  completed: "muted",
};

type MatchForm = {
  teamAId: string;
  teamBId: string;
  scoreA:  string;
  scoreB:  string;
  round:   string;
  field:   string;
};

type MatchFormErrors = {
  teamAId?: string;
  teamBId?: string;
  round?:   string;
};

const emptyMatchForm: MatchForm = {
  teamAId: "",
  teamBId: "",
  scoreA:  "",
  scoreB:  "",
  round:   "1",
  field:   "",
};

type Tab = "teams" | "matches" | "info";

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

const threeColGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  gap: "0.75rem",
  alignItems: "end",
};

export default function ManageTournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, loading, error, refetch } = useFetch<TournamentDetail>(
    `/api/tournaments/${id}`
  );
  const { data: allTeams } = useFetch<Team[]>("/api/teams");

  const [activeTab, setActiveTab] = useState<Tab>("teams");

  // ── Transfer list ────────────────────────────────────────
  const [localAvailable, setLocalAvailable] = useState<Team[]>([]);
  const [localEnrolled,  setLocalEnrolled]  = useState<Team[]>([]);
  const [bulkSaving,     setBulkSaving]     = useState(false);

  useEffect(() => {
    if (!data || !allTeams) return;
    const enrolledIds = new Set(data.teams.map((t) => t.teamId));
    setLocalEnrolled(data.teams.map((t) => t.team).filter(Boolean) as Team[]);
    setLocalAvailable(allTeams.filter((t) => !enrolledIds.has(t.id)));
  }, [data, allTeams]);

  const originalEnrolledIds = useMemo(
    () => new Set(data?.teams.map((t) => t.teamId) ?? []),
    [data]
  );

  const pendingEnrollChanges = useMemo(() => {
    const currentIds = new Set(localEnrolled.map((t) => t.id));
    if (currentIds.size !== originalEnrolledIds.size) return true;
    for (const id of currentIds) if (!originalEnrolledIds.has(id)) return true;
    return false;
  }, [localEnrolled, originalEnrolledIds]);

  function moveToEnrolled(team: Team) {
    setLocalAvailable((prev) => prev.filter((t) => t.id !== team.id));
    setLocalEnrolled((prev) => [...prev, team]);
  }

  function moveToAvailable(team: Team) {
    setLocalEnrolled((prev) => prev.filter((t) => t.id !== team.id));
    setLocalAvailable((prev) => [...prev, team]);
  }

  function enrollAll() {
    setLocalEnrolled((prev) => [...prev, ...localAvailable]);
    setLocalAvailable([]);
  }

  function removeAll() {
    setLocalAvailable((prev) => [...prev, ...localEnrolled]);
    setLocalEnrolled([]);
  }

  function resetEnrollChanges() {
    if (!data || !allTeams) return;
    const enrolledIds = new Set(data.teams.map((t) => t.teamId));
    setLocalEnrolled(data.teams.map((t) => t.team).filter(Boolean) as Team[]);
    setLocalAvailable(allTeams.filter((t) => !enrolledIds.has(t.id)));
  }

  async function handleBulkSave() {
    if (!data) return;
    setBulkSaving(true);
    const currentIds = new Set(localEnrolled.map((t) => t.id));
    const toAdd      = localEnrolled.filter((t) => !originalEnrolledIds.has(t.id));
    const toRemove   = [...originalEnrolledIds].filter((id) => !currentIds.has(id));
    await Promise.all([
      ...toAdd.map((t) =>
        fetch(`/api/tournaments/${id}/teams`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: t.id }),
        })
      ),
      ...toRemove.map((teamId) =>
        fetch(`/api/tournaments/${id}/teams`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId }),
        })
      ),
    ]);
    setBulkSaving(false);
    refetch();
  }

  // ── Match state ──────────────────────────────────────────
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchForm,      setMatchForm]      = useState<MatchForm>(emptyMatchForm);
  const [matchErrors,    setMatchErrors]    = useState<MatchFormErrors>({});
  const [matchSaving,    setMatchSaving]    = useState(false);
  const [editingMatch,   setEditingMatch]   = useState<Match | null>(null);
  const [editForm,       setEditForm]       = useState<MatchForm>(emptyMatchForm);
  const [editErrors,     setEditErrors]     = useState<MatchFormErrors>({});
  const [editSaving,     setEditSaving]     = useState(false);
  const [deletingMatch,  setDeletingMatch]  = useState<number | null>(null);

  const enrolledTeams = useMemo(() => {
    if (!data) return [];
    return data.teams.map((t) => t.team).filter(Boolean) as Team[];
  }, [data]);

  // ── Group matches by round ───────────────────────────────
  const matchesByRound = useMemo(() => {
    if (!data?.matches) return {};
    return data.matches.reduce<Record<number, Match[]>>((acc, m) => {
      const r = m.round ?? 0;
      if (!acc[r]) acc[r] = [];
      acc[r].push(m);
      return acc;
    }, {});
  }, [data]);

  function validateMatchForm(form: MatchForm): MatchFormErrors {
    const errors: MatchFormErrors = {};
    if (!form.teamAId) errors.teamAId = "Team A is required";
    if (!form.teamBId) errors.teamBId = "Team B is required";
    if (form.teamAId && form.teamBId && form.teamAId === form.teamBId)
      errors.teamBId = "Team B must be different from Team A";
    if (!form.round || parseInt(form.round, 10) < 1)
      errors.round = "Round must be at least 1";
    return errors;
  }

  async function handleAddMatch() {
    const errors = validateMatchForm(matchForm);
    if (Object.keys(errors).length > 0) { setMatchErrors(errors); return; }
    setMatchSaving(true);
    const body: CreateMatchBody = {
      tournamentId: parseInt(id, 10),
      teamAId:      parseInt(matchForm.teamAId, 10),
      teamBId:      parseInt(matchForm.teamBId, 10),
      round:        matchForm.round ? parseInt(matchForm.round, 10) : 1,
      field:        matchForm.field || undefined,
      scoreA:       matchForm.scoreA !== "" ? parseInt(matchForm.scoreA, 10) : undefined,
      scoreB:       matchForm.scoreB !== "" ? parseInt(matchForm.scoreB, 10) : undefined,
    };
    await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMatchSaving(false);
    setMatchModalOpen(false);
    setMatchForm(emptyMatchForm);
    setMatchErrors({});
    refetch();
  }

  function openEditMatch(m: Match) {
    setEditingMatch(m);
    setEditErrors({});
    setEditForm({
      teamAId: String(m.teamAId),
      teamBId: String(m.teamBId),
      scoreA:  m.scoreA != null ? String(m.scoreA) : "",
      scoreB:  m.scoreB != null ? String(m.scoreB) : "",
      round:   String(m.round ?? 1),
      field:   m.field ?? "",
    });
  }

  async function handleEditMatch() {
    const editOnlyErrors: MatchFormErrors = {};
    if (!editForm.round || parseInt(editForm.round, 10) < 1)
      editOnlyErrors.round = "Round must be at least 1";
    if (editForm.teamAId && editForm.teamBId && editForm.teamAId === editForm.teamBId)
      editOnlyErrors.teamBId = "Team B must be different from Team A";
    if (Object.keys(editOnlyErrors).length > 0) { setEditErrors(editOnlyErrors); return; }
    if (!editingMatch) return;
    setEditSaving(true);
    await fetch(`/api/matches/${editingMatch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamAId: parseInt(editForm.teamAId, 10),
        teamBId: parseInt(editForm.teamBId, 10),
        scoreA:  editForm.scoreA !== "" ? parseInt(editForm.scoreA, 10) : null,
        scoreB:  editForm.scoreB !== "" ? parseInt(editForm.scoreB, 10) : null,
        round:   parseInt(editForm.round, 10),
        field:   editForm.field || null,
      }),
    });
    setEditSaving(false);
    setEditingMatch(null);
    setEditErrors({});
    refetch();
  }

  async function handleDeleteMatch(matchId: number) {
    if (!confirm("Delete this match?")) return;
    setDeletingMatch(matchId);
    await fetch(`/api/matches/${matchId}`, { method: "DELETE" });
    setDeletingMatch(null);
    refetch();
  }

  // ── Loading / error ──────────────────────────────────────
  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <div className="h-8 w-64 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-10 w-72 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-gray-400">Tournament not found</p>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "teams",   label: "Teams",   count: data.teams.length },
    { key: "matches", label: "Matches", count: data.matches.length },
    { key: "info",    label: "Info" },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* Back */}
      <Link
        href="/manage/tournaments"
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        ← Back to Tournaments
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.name}</h1>
          <Badge variant={statusVariant[data.status] ?? "muted"}>{data.status}</Badge>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          📅 {formatDate(data.date)}
          {data.location && <span> · 📍 {data.location}</span>}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Teams ──────────────────────────────────────── */}
      {activeTab === "teams" && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Team Enrollment</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", gap: "0.75rem", alignItems: "start" }}>
            {/* Available */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Available</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full px-2 py-0.5 tabular-nums">
                  {localAvailable.length}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                {localAvailable.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-xs text-gray-400">All teams enrolled</div>
                ) : (
                  localAvailable.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => moveToEnrolled(team)}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      {team.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Bulk arrows */}
            <div className="flex flex-col gap-2 items-center pt-8">
              <button
                onClick={enrollAll}
                disabled={localAvailable.length === 0}
                title="Enroll all"
                className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-teal-500 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >»</button>
              <button
                onClick={removeAll}
                disabled={localEnrolled.length === 0}
                title="Remove all"
                className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-red-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >«</button>
            </div>

            {/* Enrolled */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Enrolled</span>
                <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full px-2 py-0.5 tabular-nums font-semibold">
                  {localEnrolled.length}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                {localEnrolled.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-xs text-gray-400">No teams enrolled</div>
                ) : (
                  localEnrolled.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => moveToAvailable(team)}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      {team.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {pendingEnrollChanges && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 text-sm">
              <span className="text-teal-700 dark:text-teal-400">Unsaved enrollment changes</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={resetEnrollChanges}>Reset</Button>
                <Button size="sm" loading={bulkSaving} onClick={handleBulkSave}>Save Changes</Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Matches ────────────────────────────────────── */}
      {activeTab === "matches" && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Matches</h2>
            <Button
              size="sm"
              onClick={() => { setMatchForm(emptyMatchForm); setMatchErrors({}); setMatchModalOpen(true); }}
              disabled={enrolledTeams.length < 2}
              title={enrolledTeams.length < 2 ? "Enroll at least 2 teams first" : ""}
            >
              + Add Match
            </Button>
          </div>

          {data.matches.length === 0 ? (
            <div className="text-center py-10 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
              <p className="text-2xl mb-2">🎮</p>
              <p className="font-medium">No matches yet</p>
              <p className="text-sm mt-1">
                {enrolledTeams.length < 2
                  ? "Enroll at least 2 teams to add matches"
                  : 'Click "+ Add Match" to create the first match'}
              </p>
            </div>
          ) : (
            Object.entries(matchesByRound)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([round, matches]) => (
                <div key={round} className="space-y-3">
                  {/* Round heading */}
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-3">
                    <span>{Number(round) === 0 ? "Unassigned" : `Round ${round}`}</span>
                    <span className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                  </h3>

                  {/* Match cards */}
                  <div className="space-y-2">
                    {matches.map((m) => {
                      const aWins = m.status === "completed" && (m.scoreA ?? 0) > (m.scoreB ?? 0);
                      const bWins = m.status === "completed" && (m.scoreB ?? 0) > (m.scoreA ?? 0);
                      const draw  = m.status === "completed" && m.scoreA === m.scoreB;

                      return (
                        <div
                          key={m.id}
                          className="px-4 py-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors space-y-2"
                        >
                          {/* ── MOBILE only ── */}
                          <div className="flex items-center gap-2 sm:hidden">
                            <span className={`flex-1 text-sm font-medium truncate ${
                              aWins ? "text-green-500 dark:text-green-400 font-bold" :
                              bWins ? "text-gray-400 dark:text-gray-500" :
                              "text-gray-900 dark:text-gray-100"
                            }`}>{m.teamA?.name ?? "TBD"}</span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {m.status === "completed" ? (
                                <>
                                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-xs font-bold tabular-nums ${
                                    aWins ? "bg-green-600" : draw ? "bg-gray-500" : "bg-red-500"
                                  }`}>{m.scoreA}</span>
                                  <span className="text-gray-400 text-xs">·</span>
                                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-xs font-bold tabular-nums ${
                                    bWins ? "bg-green-600" : draw ? "bg-gray-500" : "bg-red-500"
                                  }`}>{m.scoreB}</span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-500 px-2">vs</span>
                              )}
                            </div>

                            <span className={`flex-1 text-sm font-medium truncate text-right ${
                              bWins ? "text-green-500 dark:text-green-400 font-bold" :
                              aWins ? "text-gray-400 dark:text-gray-500" :
                              "text-gray-900 dark:text-gray-100"
                            }`}>{m.teamB?.name ?? "TBD"}</span>
                          </div>

                          {/* ── DESKTOP only ── */}
                          <div className="hidden sm:flex items-center gap-3 py-1">
                            <span className={`flex-1 text-base font-semibold truncate ${
                              aWins ? "text-green-500 dark:text-green-400" :
                              bWins ? "text-gray-400 dark:text-gray-500" :
                              "text-gray-900 dark:text-gray-100"
                            }`}>{m.teamA?.name ?? "TBD"}</span>

                            <div className="flex items-center gap-2 shrink-0">
                              {m.status === "completed" ? (
                                <>
                                  <span className={`w-12 h-12 flex items-center justify-center rounded-full text-white text-xl font-bold tabular-nums ${
                                    aWins ? "bg-green-600" : draw ? "bg-gray-500" : "bg-red-500"
                                  }`}>{m.scoreA}</span>
                                  <span className="text-gray-400 text-xl">·</span>
                                  <span className={`w-12 h-12 flex items-center justify-center rounded-full text-white text-xl font-bold tabular-nums ${
                                    bWins ? "bg-green-600" : draw ? "bg-gray-500" : "bg-red-500"
                                  }`}>{m.scoreB}</span>
                                </>
                              ) : (
                                <span className="text-sm font-bold text-gray-400 dark:text-gray-500 px-4">VS</span>
                              )}
                            </div>

                            <span className={`flex-1 text-base font-semibold truncate text-right ${
                              bWins ? "text-green-500 dark:text-green-400" :
                              aWins ? "text-gray-400 dark:text-gray-500" :
                              "text-gray-900 dark:text-gray-100"
                            }`}>{m.teamB?.name ?? "TBD"}</span>
                          </div>

                          {/* ── Status + actions (both layouts) ── */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={m.status === "completed" ? "muted" : "warning"}>
                                {m.status}
                              </Badge>
                              {m.field && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">{m.field}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" onClick={() => openEditMatch(m)}>Edit</Button>
                              <Button
                                size="sm"
                                variant="danger"
                                loading={deletingMatch === m.id}
                                onClick={() => handleDeleteMatch(m.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          )}
        </section>
      )}

      {/* ── Tab: Info ───────────────────────────────────────── */}
      {activeTab === "info" && (
        <section>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-md">
            <div className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
              {[
                { label: "Name",     value: data.name },
                { label: "Date",     value: formatDate(data.date) },
                { label: "Location", value: data.location ?? "—" },
                { label: "Status",   value: <Badge variant={statusVariant[data.status] ?? "muted"}>{data.status}</Badge> },
                { label: "Teams",    value: data.teams.length },
                { label: "Matches",  value: data.matches.length },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Add Match Modal ─────────────────────────────────── */}
      <Modal
        open={matchModalOpen}
        onClose={() => { setMatchModalOpen(false); setMatchErrors({}); }}
        title="Add Match"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAddMatch(); }} className="space-y-5">

          {/* Teams */}
          <div style={threeColGrid}>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Team A <span className="text-red-400">*</span>
              </label>
              <select
                value={matchForm.teamAId}
                onChange={(e) => {
                  setMatchForm({ ...matchForm, teamAId: e.target.value });
                  if (matchErrors.teamAId) setMatchErrors((p) => ({ ...p, teamAId: undefined }));
                }}
                className={selectCls(!!matchErrors.teamAId)}
              >
                <option value="">Select team...</option>
                {enrolledTeams.map((t) => (
                  <option key={t.id} value={t.id} disabled={String(t.id) === matchForm.teamBId}>{t.name}</option>
                ))}
              </select>
              {matchErrors.teamAId && <p className="text-xs text-red-500">{matchErrors.teamAId}</p>}
            </div>

            <div className="flex items-center justify-center pb-2">
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500">VS</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Team B <span className="text-red-400">*</span>
              </label>
              <select
                value={matchForm.teamBId}
                onChange={(e) => {
                  setMatchForm({ ...matchForm, teamBId: e.target.value });
                  if (matchErrors.teamBId) setMatchErrors((p) => ({ ...p, teamBId: undefined }));
                }}
                className={selectCls(!!matchErrors.teamBId)}
              >
                <option value="">Select team...</option>
                {enrolledTeams.map((t) => (
                  <option key={t.id} value={t.id} disabled={String(t.id) === matchForm.teamAId}>{t.name}</option>
                ))}
              </select>
              {matchErrors.teamBId && <p className="text-xs text-red-500">{matchErrors.teamBId}</p>}
            </div>
          </div>

          {/* Scores */}
          <div style={threeColGrid}>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Score A <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="number" min="0"
                value={matchForm.scoreA}
                onChange={(e) => setMatchForm({ ...matchForm, scoreA: e.target.value })}
                className={inputCls()}
                placeholder="—"
              />
            </div>
            <div className="flex items-center justify-center pb-2">
              <span className="text-sm font-bold text-gray-300 dark:text-gray-600">–</span>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Score B <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="number" min="0"
                value={matchForm.scoreB}
                onChange={(e) => setMatchForm({ ...matchForm, scoreB: e.target.value })}
                className={inputCls()}
                placeholder="—"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700" />

          {/* Round + Field */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Round <span className="text-red-400">*</span>
              </label>
              <input
                type="number" min="1"
                value={matchForm.round}
                onChange={(e) => {
                  setMatchForm({ ...matchForm, round: e.target.value });
                  if (matchErrors.round) setMatchErrors((p) => ({ ...p, round: undefined }));
                }}
                className={inputCls(!!matchErrors.round)}
              />
              {matchErrors.round && <p className="text-xs text-red-500">{matchErrors.round}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Field <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={matchForm.field}
                onChange={(e) => setMatchForm({ ...matchForm, field: e.target.value })}
                className={inputCls()}
                placeholder="e.g. Field 1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => { setMatchModalOpen(false); setMatchErrors({}); }}>
              Cancel
            </Button>
            <Button type="submit" loading={matchSaving}>+ Add Match</Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Match Modal ────────────────────────────────── */}
      <Modal
        open={!!editingMatch}
        onClose={() => { setEditingMatch(null); setEditErrors({}); }}
        title="Edit Match"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleEditMatch(); }} className="space-y-5">

          {/* Teams */}
          <div style={threeColGrid}>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Team A</label>
              <select
                value={editForm.teamAId}
                onChange={(e) => setEditForm({ ...editForm, teamAId: e.target.value })}
                className={selectCls()}
              >
                {enrolledTeams.map((t) => (
                  <option key={t.id} value={t.id} disabled={String(t.id) === editForm.teamBId}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center pb-2">
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500">VS</span>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Team B</label>
              <select
                value={editForm.teamBId}
                onChange={(e) => setEditForm({ ...editForm, teamBId: e.target.value })}
                className={selectCls()}
              >
                {enrolledTeams.map((t) => (
                  <option key={t.id} value={t.id} disabled={String(t.id) === editForm.teamAId}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scores */}
          <div style={threeColGrid}>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Score A</label>
              <input
                type="number" min="0"
                value={editForm.scoreA}
                onChange={(e) => setEditForm({ ...editForm, scoreA: e.target.value })}
                className={inputCls()}
                placeholder="—"
              />
            </div>
            <div className="flex items-center justify-center pb-2">
              <span className="text-sm font-bold text-gray-300 dark:text-gray-600">–</span>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Score B</label>
              <input
                type="number" min="0"
                value={editForm.scoreB}
                onChange={(e) => setEditForm({ ...editForm, scoreB: e.target.value })}
                className={inputCls()}
                placeholder="—"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700" />

          {/* Round + Field */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Round <span className="text-red-400">*</span>
              </label>
              <input
                type="number" min="1"
                value={editForm.round}
                onChange={(e) => {
                  setEditForm({ ...editForm, round: e.target.value });
                  if (editErrors.round) setEditErrors((p) => ({ ...p, round: undefined }));
                }}
                className={inputCls(!!editErrors.round)}
              />
              {editErrors.round && <p className="text-xs text-red-500">{editErrors.round}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Field <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={editForm.field}
                onChange={(e) => setEditForm({ ...editForm, field: e.target.value })}
                className={inputCls()}
                placeholder="e.g. Field 1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => { setEditingMatch(null); setEditErrors({}); }}>
              Cancel
            </Button>
            <Button type="submit" loading={editSaving}>Save Changes</Button>
          </div>
        </form>
      </Modal>

    </main>
  );
}