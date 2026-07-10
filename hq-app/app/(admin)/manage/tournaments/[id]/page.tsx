"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TeamsTab } from "@/components/tournament-detail/TeamsTab";
import { MatchesTab } from "@/components/tournament-detail/MatchesTab";
import { formatDate } from "@/lib/utils";
import type { Tournament, Team, Match, CreateMatchBody } from "@/types";
import { BracketTab } from "@/components/tournament-detail/BracketTab";
import { InfoTab } from "@/components/tournament-detail/InfoTab";
import type { TournamentDetail } from "@/types";
import MatchModal, {
  MatchForm,
  MatchFormErrors,
  emptyMatchForm,
} from "@/components/matches/MatchModal";

const statusVariant: Record<string, "default" | "success" | "warning" | "muted"> = {
  upcoming: "warning",
  active: "default",
  completed: "muted",
};

type Tab = "teams" | "matches" | "bracket" | "info";

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

  // ── Transfer list ─────────────────────────────────────────
  const [localAvailable, setLocalAvailable] = useState<Team[]>([]);
  const [localEnrolled, setLocalEnrolled] = useState<Team[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

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

  const [editingBracketMatch, setEditingBracketMatch] = useState<Match | null>(null);
  const [bracketEditSaving, setBracketEditSaving] = useState(false);

  function openBracketEdit(match: Match) {
    setEditingBracketMatch(match);
  }

  function closeBracketEdit() {
    setEditingBracketMatch(null);
  }

  async function handleSaveBracketEdit(
    matchId: number,
    teamAId: number | null,
    teamBId: number | null
  ) {
    setBracketEditSaving(true);

    await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamAId,
        teamBId,
        scoreA: null,
        scoreB: null,
        status: "pending",
      }),
    });

    setBracketEditSaving(false);
    setEditingBracketMatch(null);
    refetch();
  }

  async function handleBulkSave() {
    if (!data) return;
    setBulkSaving(true);
    const currentIds = new Set(localEnrolled.map((t) => t.id));
    const toAdd = localEnrolled.filter((t) => !originalEnrolledIds.has(t.id));
    const toRemove = [...originalEnrolledIds].filter((id) => !currentIds.has(id));

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

  // ── Match state ───────────────────────────────────────────
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchForm, setMatchForm] = useState<MatchForm>(emptyMatchForm);
  const [matchErrors, setMatchErrors] = useState<MatchFormErrors>({});
  const [matchSaving, setMatchSaving] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editForm, setEditForm] = useState<MatchForm>(emptyMatchForm);
  const [editErrors, setEditErrors] = useState<MatchFormErrors>({});
  const [editSaving, setEditSaving] = useState(false);
  const [deletingMatch, setDeletingMatch] = useState<number | null>(null);

  // ── Group generation state ────────────────────────────────
  const [generatingGroups, setGeneratingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  // ── Bracket state ─────────────────────────────────────────
  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);
  const [resettingBracket, setResettingBracket] = useState(false);

  async function handleResetBracket() {
    if (!confirm("Delete the entire bracket? This cannot be undone.")) return;
    setResettingBracket(true);
    await fetch(`/api/tournaments/${id}/generate-bracket`, { method: "DELETE" });
    setResettingBracket(false);
    refetch();
  }

  // ── Bracket inline score editing ──────────────────────────
  const [bracketScores, setBracketScores] = useState<
    Record<number, { scoreA: string; scoreB: string }>
  >({});
  const [savingBracketMatch, setSavingBracketMatch] = useState<number | null>(null);

  function getBracketScore(matchId: number) {
    return bracketScores[matchId] ?? { scoreA: "", scoreB: "" };
  }

  async function handleSaveBracketScore(matchId: number) {
    const { scoreA, scoreB } = getBracketScore(matchId);
    setSavingBracketMatch(matchId);

    await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scoreA: scoreA !== "" ? parseInt(scoreA, 10) : null,
        scoreB: scoreB !== "" ? parseInt(scoreB, 10) : null,
      }),
    });

    setSavingBracketMatch(null);
    refetch();
  }

  const enrolledTeams = useMemo(() => {
    if (!data) return [];
    return data.teams.map((t) => t.team).filter(Boolean) as Team[];
  }, [data]);

  const matchesByRound = useMemo(() => {
    if (!data?.matches) return {};
    return data.matches
      .filter((m) => m.phase === "group")
      .reduce<Record<number, Match[]>>((acc, m) => {
        const r = m.round ?? 0;
        if (!acc[r]) acc[r] = [];
        acc[r].push(m);
        return acc;
      }, {});
  }, [data]);

  const hasBracketMatches = useMemo(
    () =>
      data?.matches.some(
        (m) =>
          m.phase &&
          m.phase !== "group"
      ) ?? false,
    [data]
  );

  const hasGroupMatches = useMemo(
    () => data?.matches.some((m) => m.phase === "group") ?? false,
    [data]
  );

  const isGroupAndBracket = data?.type === "group_and_bracket";
  const isClassic = data?.type === "round_robin_classic";
  const canAddMatch = data?.type === "round_robin" || data?.type === "round_robin_classic";

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
    if (Object.keys(errors).length > 0) {
      setMatchErrors(errors);
      return;
    }

    setMatchSaving(true);

    const body: CreateMatchBody = {
      tournamentId: parseInt(id, 10),
      teamAId: parseInt(matchForm.teamAId, 10),
      teamBId: parseInt(matchForm.teamBId, 10),
      round: matchForm.round ? parseInt(matchForm.round, 10) : 1,
      field: matchForm.field || undefined,
      scoreA: matchForm.scoreA !== "" ? parseInt(matchForm.scoreA, 10) : undefined,
      scoreB: matchForm.scoreB !== "" ? parseInt(matchForm.scoreB, 10) : undefined,
      bodyCountA: matchForm.bodyCountA !== "" ? parseInt(matchForm.bodyCountA, 10) : undefined,
      bodyCountB: matchForm.bodyCountB !== "" ? parseInt(matchForm.bodyCountB, 10) : undefined,
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
      scoreA: m.scoreA !== null ? String(m.scoreA) : "",
      scoreB: m.scoreB !== null ? String(m.scoreB) : "",
      bodyCountA: m.bodyCountA != null ? String(m.bodyCountA) : "",
      bodyCountB: m.bodyCountB != null ? String(m.bodyCountB) : "",
      round: String(m.round ?? 1),
      field: m.field ?? "",
    });
  }

  async function handleEditMatch() {
    const editOnlyErrors: MatchFormErrors = {};
    if (!editForm.round || parseInt(editForm.round, 10) < 1)
      editOnlyErrors.round = "Round must be at least 1";
    if (editForm.teamAId && editForm.teamBId && editForm.teamAId === editForm.teamBId)
      editOnlyErrors.teamBId = "Team B must be different from Team A";

    if (Object.keys(editOnlyErrors).length > 0) {
      setEditErrors(editOnlyErrors);
      return;
    }

    if (!editingMatch) return;

    setEditSaving(true);

    await fetch(`/api/matches/${editingMatch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamAId: parseInt(editForm.teamAId, 10),
        teamBId: parseInt(editForm.teamBId, 10),
        scoreA: editForm.scoreA !== "" ? parseInt(editForm.scoreA, 10) : null,
        scoreB: editForm.scoreB !== "" ? parseInt(editForm.scoreB, 10) : null,
        bodyCountA: editForm.bodyCountA !== "" ? parseInt(editForm.bodyCountA, 10) : null,
        bodyCountB: editForm.bodyCountB !== "" ? parseInt(editForm.bodyCountB, 10) : null,
        round: parseInt(editForm.round, 10),
        field: editForm.field || null,
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

  async function handleGenerateGroups() {
    if (!confirm("Generate group stage matches? This cannot be undone.")) return;

    setGeneratingGroups(true);
    setGroupsError(null);

    const res = await fetch(`/api/tournaments/${id}/generate-groups`, {
      method: "POST",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setGroupsError(body.error ?? "Failed to generate groups");
    } else {
      refetch();
    }

    setGeneratingGroups(false);
  }

  async function handleGenerateBracket() {

    if (!data) return;
    
    if (data.type === "round_robin" || data.type === "round_robin_classic") {
      setBracketError("Bracket generation is not available for round robin tournaments");
      return;
    }

    if (!confirm("Generate bracket from current standings? This cannot be undone.")) return;
    setGeneratingBracket(true);
    setBracketError(null);

    const res = await fetch(`/api/tournaments/${id}/generate-bracket`, {
      method: "POST",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setBracketError(body.error ?? "Failed to generate bracket");
    } else {
      refetch();
    }

    setGeneratingBracket(false);
  }

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
    { key: "teams", label: "Teams", count: data.teams.length },
    {
      key: "matches",
      label: "Matches",
      count: data.matches.filter((m) => m.phase === "group").length,
    },
    ...(data.type !== "round_robin" && data.type !== "round_robin_classic"
      ? [
          {
            key: "bracket" as Tab,
            label: "Bracket",
            count: data.matches.filter((m) => m.phase !== "group").length,
          },
        ]
      : []),
    { key: "info", label: "Info" },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <Link
        href="/manage/tournaments"
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        ← Back to Tournaments
      </Link>

      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.name}
          </h1>
          <Badge variant={statusVariant[data.status] ?? "muted"}>{data.status}</Badge>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 capitalize">
            {(data.type ?? "round_robin").replace(/_/g, " ")}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          📅 {formatDate(data.date)}
          {data.location && <span> · 📍 {data.location}</span>}
        </p>
      </div>

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
              <span
                className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "teams" && (
        <TeamsTab
          localAvailable={localAvailable}
          localEnrolled={localEnrolled}
          pendingEnrollChanges={pendingEnrollChanges}
          bulkSaving={bulkSaving}
          onMoveToEnrolled={moveToEnrolled}
          onMoveToAvailable={moveToAvailable}
          onEnrollAll={enrollAll}
          onRemoveAll={removeAll}
          onReset={resetEnrollChanges}
          onSave={handleBulkSave}
        />
      )}

      {activeTab === "matches" && (
        <MatchesTab
          matches={data.matches}
          enrolledTeams={enrolledTeams}
          isGroupAndBracket={isGroupAndBracket}
          isClassic={isClassic}
          canAddMatch={canAddMatch}
          hasGroupMatches={hasGroupMatches}
          generatingGroups={generatingGroups}
          groupsError={groupsError}
          deletingMatch={deletingMatch}
          onGenerateGroups={handleGenerateGroups}
          onOpenAddMatch={() => {
            setMatchForm(emptyMatchForm);
            setMatchErrors({});
            setMatchModalOpen(true);
          }}
          onEditMatch={openEditMatch}
          onDeleteMatch={handleDeleteMatch}
        />
      )}

      {activeTab === "bracket" && (
        <BracketTab
          matches={data.matches}
          enrolledTeams={enrolledTeams}
          hasBracketMatches={hasBracketMatches}
          generatingBracket={generatingBracket}
          resettingBracket={resettingBracket}
          bracketError={bracketError}
          savingBracketMatch={savingBracketMatch}
          bracketScores={bracketScores}
          onGenerateBracket={handleGenerateBracket}
          onResetBracket={handleResetBracket}
          onScoreChange={(id, field, val) =>
            setBracketScores((prev) => ({
              ...prev,
              [id]: { ...(prev[id] ?? { scoreA: "", scoreB: "" }), [field]: val },
            }))
          }
          onSaveBracketScore={handleSaveBracketScore}
          editingBracketMatch={editingBracketMatch}
          bracketEditSaving={bracketEditSaving}
          onOpenBracketEdit={openBracketEdit}
          onCloseBracketEdit={closeBracketEdit}
          onSaveBracketEdit={handleSaveBracketEdit}
        />
      )}

      {activeTab === "info" && <InfoTab data={data} />}

      <MatchModal
        open={matchModalOpen}
        title="Add Match"
        submitLabel="+ Add Match"
        loading={matchSaving}
        isClassic={isClassic}
        requireTeams
        teams={enrolledTeams}
        form={matchForm}
        errors={matchErrors}
        setForm={setMatchForm}
        setErrors={setMatchErrors}
        onClose={() => {
          setMatchModalOpen(false);
          setMatchErrors({});
        }}
        onSubmit={handleAddMatch}
      />

      <MatchModal
        open={!!editingMatch}
        title="Edit Match"
        submitLabel="Save Changes"
        loading={editSaving}
        isClassic={isClassic}
        teams={enrolledTeams}
        form={editForm}
        errors={editErrors}
        setForm={setEditForm}
        setErrors={setEditErrors}
        onClose={() => {
          setEditingMatch(null);
          setEditErrors({});
        }}
        onSubmit={handleEditMatch}
      />
    </main>
  );
}