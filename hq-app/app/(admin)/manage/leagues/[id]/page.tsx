"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import type { League, Team, Tournament } from "@/types";

type EnrolledTeam = { teamId: number; team: Team };

type LeagueDetail = League & {
  tournaments: Tournament[];
  teams: EnrolledTeam[];
};

const statusVariant: Record<string, "default" | "success" | "warning" | "muted"> = {
  upcoming:  "warning",
  active:    "default",
  completed: "muted",
};

type Tab = "tournaments" | "teams" | "info";

type LeagueFormState = {
  name: string;
  description: string;
  logoUrl: string;
};

export default function ManageLeagueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, loading, error, refetch } = useFetch<LeagueDetail>(`/api/leagues/${id}`);
  const { data: allTeams }       = useFetch<Team[]>("/api/teams");
  const { data: allTournaments } = useFetch<Tournament[]>("/api/tournaments");

  const [activeTab, setActiveTab] = useState<Tab>("tournaments");

  // ── Info edit ────────────────────────────────────────────
  const [infoForm, setInfoForm]     = useState<LeagueFormState>({ name: "", description: "", logoUrl: "" });
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoEditing, setInfoEditing] = useState(false);

  useEffect(() => {
    if (!data) return;
    setInfoForm({
      name:        data.name,
      description: data.description ?? "",
      logoUrl:     data.logoUrl ?? "",
    });
  }, [data]);

  async function handleInfoSave() {
    if (!infoForm.name.trim()) return;
    setInfoSaving(true);
    await fetch(`/api/leagues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:        infoForm.name,
        description: infoForm.description || null,
        logoUrl:     infoForm.logoUrl || null,
      }),
    });
    setInfoSaving(false);
    setInfoEditing(false);
    refetch();
  }

  // ── Team transfer list ───────────────────────────────────
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

  const pendingTeamChanges = useMemo(() => {
    const currentIds = new Set(localEnrolled.map((t) => t.id));
    if (currentIds.size !== originalEnrolledIds.size) return true;
    for (const id of currentIds) if (!originalEnrolledIds.has(id)) return true;
    return false;
  }, [localEnrolled, originalEnrolledIds]);

  function moveToEnrolled(team: Team) {
    setLocalAvailable((p) => p.filter((t) => t.id !== team.id));
    setLocalEnrolled((p) => [...p, team]);
  }
  function moveToAvailable(team: Team) {
    setLocalEnrolled((p) => p.filter((t) => t.id !== team.id));
    setLocalAvailable((p) => [...p, team]);
  }
  function enrollAll() {
    setLocalEnrolled((p) => [...p, ...localAvailable]);
    setLocalAvailable([]);
  }
  function removeAll() {
    setLocalAvailable((p) => [...p, ...localEnrolled]);
    setLocalEnrolled([]);
  }
  function resetTeamChanges() {
    if (!data || !allTeams) return;
    const enrolledIds = new Set(data.teams.map((t) => t.teamId));
    setLocalEnrolled(data.teams.map((t) => t.team).filter(Boolean) as Team[]);
    setLocalAvailable(allTeams.filter((t) => !enrolledIds.has(t.id)));
  }

  async function handleTeamBulkSave() {
    setBulkSaving(true);
    await fetch(`/api/leagues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamIds: localEnrolled.map((t) => t.id) }),
    });
    setBulkSaving(false);
    refetch();
  }

  // ── Tournament assignment ────────────────────────────────
  const [tournamentModalOpen, setTournamentModalOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [assigningSaving, setAssigningSaving] = useState(false);
  const [detaching, setDetaching] = useState<number | null>(null);

  const unassignedTournaments = useMemo(() => {
    if (!allTournaments || !data) return [];
    const assigned = new Set(data.tournaments.map((t) => t.id));
    return allTournaments.filter((t) => !assigned.has(t.id) && !t.leagueId);
  }, [allTournaments, data]);

  async function handleAssignTournament() {
    if (!selectedTournamentId) return;
    setAssigningSaving(true);
    await fetch(`/api/tournaments/${selectedTournamentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueId: parseInt(id, 10) }),
    });
    setAssigningSaving(false);
    setTournamentModalOpen(false);
    setSelectedTournamentId("");
    refetch();
  }

  async function handleDetachTournament(tournamentId: number) {
    if (!confirm("Remove this tournament from the league?")) return;
    setDetaching(tournamentId);
    await fetch(`/api/tournaments/${tournamentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueId: null }),
    });
    setDetaching(null);
    refetch();
  }

  const inputCls = `w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`;

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
        <p className="text-gray-400">League not found</p>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "tournaments", label: "Tournaments", count: data.tournaments.length },
    { key: "teams",       label: "Teams",       count: data.teams.length },
    { key: "info",        label: "Info" },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* Back */}
      <Link
        href="/manage/leagues"
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        ← Back to Leagues
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.name}</h1>
        {data.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{data.description}</p>
        )}
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

      {/* ── Tab: Tournaments ────────────────────────────────── */}
      {activeTab === "tournaments" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tournaments</h2>
            <Button size="sm" onClick={() => setTournamentModalOpen(true)}>
              + Assign Tournament
            </Button>
          </div>

          {data.tournaments.length === 0 ? (
            <div className="text-center py-10 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
              <p className="text-2xl mb-2">🏆</p>
              <p className="font-medium">No tournaments yet</p>
              <p className="text-sm mt-1">Assign existing tournaments or create new ones under this league</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Format</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.tournaments.map((t) => (
                    <tr key={t.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{t.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(t.date)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">
                        {(t.type ?? "round_robin").replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[t.status] ?? "muted"}>{t.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/manage/tournaments/${t.id}`}>
                            <Button variant="ghost" size="sm">Manage →</Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            loading={detaching === t.id}
                            onClick={() => handleDetachTournament(t.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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

          {pendingTeamChanges && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 text-sm">
              <span className="text-teal-700 dark:text-teal-400">Unsaved enrollment changes</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={resetTeamChanges}>Reset</Button>
                <Button size="sm" loading={bulkSaving} onClick={handleTeamBulkSave}>Save Changes</Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Info ───────────────────────────────────────── */}
      {activeTab === "info" && (
        <section className="space-y-4 max-w-md">
          {!infoEditing ? (
            <>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <div className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                  {[
                    { label: "Name",         value: data.name },
                    { label: "Description",  value: data.description ?? "—" },
                    { label: "Logo URL",     value: data.logoUrl ?? "—" },
                    { label: "Tournaments",  value: data.tournaments.length },
                    { label: "Teams",        value: data.teams.length },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2.5">
                      <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setInfoEditing(true)}>
                Edit Info
              </Button>
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleInfoSave(); }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={infoForm.name}
                  onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                  className={inputCls}
                  placeholder="League name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={infoForm.description}
                  onChange={(e) => setInfoForm({ ...infoForm, description: e.target.value })}
                  className={inputCls}
                  rows={3}
                  placeholder="Short description..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo URL</label>
                <input
                  value={infoForm.logoUrl}
                  onChange={(e) => setInfoForm({ ...infoForm, logoUrl: e.target.value })}
                  className={inputCls}
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" type="button" onClick={() => setInfoEditing(false)}>Cancel</Button>
                <Button type="submit" loading={infoSaving}>Save Changes</Button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* ── Assign Tournament Modal ──────────────────────────── */}
      <Modal
        open={tournamentModalOpen}
        onClose={() => { setTournamentModalOpen(false); setSelectedTournamentId(""); }}
        title="Assign Tournament"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Only unassigned tournaments are shown. To move a tournament between leagues, remove it from the other league first.
          </p>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tournament</label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className={inputCls}
            >
              <option value="">Select tournament...</option>
              {unassignedTournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {formatDate(t.date)}
                </option>
              ))}
            </select>
            {unassignedTournaments.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">No unassigned tournaments available</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => { setTournamentModalOpen(false); setSelectedTournamentId(""); }}>
              Cancel
            </Button>
            <Button
              loading={assigningSaving}
              disabled={!selectedTournamentId}
              onClick={handleAssignTournament}
            >
              Assign
            </Button>
          </div>
        </div>
      </Modal>

    </main>
  );
}