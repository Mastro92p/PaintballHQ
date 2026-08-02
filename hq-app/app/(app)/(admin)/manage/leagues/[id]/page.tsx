"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import type { Team, Tournament, LeagueDetail, LeagueFormState } from "@/types";
import { TeamsTransferTab } from "@/components/ui/TeamsTransferTab";
import { LeagueInfoTab } from "@/components/leagues/LeagueInfoTab";
import { AssignTournamentModal } from "@/components/leagues/AssignTournamentModal";
import { LeagueTournamentsTab } from "@/components/leagues/LeagueTournamentsTab";
import { LeaguePageHeader } from "@/components/leagues/LeaguePageHeader";
import { LeagueDetailSkeleton } from "@/components/leagues/LeagueDetailSkeleton";
import { LeagueNotFoundState } from "@/components/leagues/LeagueNotFoundState";
import { handleMissingEntity } from "@/lib/handle-missing-entity";
import { DivisionFilterChips } from "@/components/ui/DivisionFilterChips";
import LeagueManualRankingsTab from "@/components/leagues/LeagueManualRankingsTab";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type Tab = "tournaments" | "teams" | "manual-standings" | "info";

export default function ManageLeagueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, loading, error } = useFetch<LeagueDetail>(`/api/leagues/${id}`);
  const { data: allTeams } = useFetch<Team[]>("/api/teams");
  const { data: allTournaments } = useFetch<Tournament[]>("/api/tournaments");

  const [activeTab, setActiveTab] = useState<Tab>("tournaments");

  const [infoForm, setInfoForm] = useState<LeagueFormState>({
    name: "",
    description: "",
    logoUrl: "",
    isHidden: false,
  });
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoEditing, setInfoEditing] = useState(false);

  const [localLeague, setLocalLeague] = useState<LeagueDetail | null>(null);

  const [localAvailable, setLocalAvailable] = useState<Team[]>([]);
  const [localEnrolled, setLocalEnrolled] = useState<Team[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  const [tournamentModalOpen, setTournamentModalOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [assigningSaving, setAssigningSaving] = useState(false);
  const [detaching, setDetaching] = useState<number | null>(null);

  const [tournamentToDetachId, setTournamentToDetachId] = useState<number | null>(
    null
  );

  const [localAllTournaments, setLocalAllTournaments] = useState<Tournament[]>([]);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");

  const tournamentToDetach =
    tournamentToDetachId != null && localLeague
      ? localLeague.tournaments.find((t) => t.id === tournamentToDetachId) ?? null
      : null;

  function closeTournamentModal() {
    setTournamentModalOpen(false);
    setSelectedTournamentId("");
  }

  useEffect(() => {
    if (!data) return;
    setLocalLeague(data);
  }, [data]);

  useEffect(() => {
    if (!localLeague) return;
    setInfoForm({
      name: localLeague.name,
      description: localLeague.description ?? "",
      logoUrl: localLeague.logoUrl ?? "",
      isHidden: false,
    });
  }, [localLeague]);

  useEffect(() => {
    if (!allTournaments) return;
    setLocalAllTournaments(allTournaments);
  }, [allTournaments]);

  useEffect(() => {
    if (!localLeague || !allTeams) return;
    const enrolledIds = new Set(localLeague.teams.map((t) => t.teamId));
    setLocalEnrolled(
      localLeague.teams.map((t) => t.team).filter(Boolean) as Team[]
    );
    setLocalAvailable(allTeams.filter((t) => !enrolledIds.has(t.id)));
  }, [localLeague, allTeams]);

  const assignedDivisions = useMemo(() => {
    if (!localLeague?.tournaments) return [];

    const map = new Map<
      number,
      { id: number; name: string; isActive?: boolean | null; sortOrder?: number | null }
    >();

    localLeague.tournaments.forEach((t) => {
      if (t.division) {
        map.set(t.division.id, {
          id: t.division.id,
          name: t.division.name,
          isActive: t.division.isActive,
          sortOrder: t.division.sortOrder,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const aSort = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bSort = b.sortOrder ?? Number.MAX_SAFE_INTEGER;

      if (aSort !== bSort) return aSort - bSort;
      return a.name.localeCompare(b.name);
    });
  }, [localLeague]);

  const filteredLeagueTournaments = useMemo(() => {
    if (!localLeague?.tournaments) return [];

    return localLeague.tournaments.filter((t) => {
      if (divisionFilter === "all") return true;
      if (divisionFilter === "unassigned") return t.divisionId == null;
      return t.divisionId === Number(divisionFilter);
    });
  }, [localLeague, divisionFilter]);

  const originalEnrolledIds = useMemo(
    () => new Set(localLeague?.teams.map((t) => t.teamId) ?? []),
    [localLeague]
  );

  const pendingTeamChanges = useMemo(() => {
    const currentIds = new Set(localEnrolled.map((t) => t.id));
    if (currentIds.size !== originalEnrolledIds.size) return true;
    for (const teamId of currentIds) {
      if (!originalEnrolledIds.has(teamId)) return true;
    }
    return false;
  }, [localEnrolled, originalEnrolledIds]);

  const unassignedTournaments = useMemo(() => {
    if (!localLeague) return [];
    const assignedIds = new Set(localLeague.tournaments.map((t) => t.id));
    return localAllTournaments.filter(
      (t) => !assignedIds.has(t.id) && !t.leagueId
    );
  }, [localAllTournaments, localLeague]);


  const sortedManualStandingTables = useMemo(() => {
    return [...(localLeague?.manualStandingTables ?? [])].sort((a, b) => {
      const aSort = a.division?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bSort = b.division?.sortOrder ?? Number.MAX_SAFE_INTEGER;

      if (aSort !== bSort) return aSort - bSort;

      const aName = a.division?.name ?? "";
      const bName = b.division?.name ?? "";
      return aName.localeCompare(bName);
    });
  }, [localLeague?.manualStandingTables]);
  

  const [regeneratingRankings, setRegeneratingRankings] = useState(false);

  async function reloadLeague() {
    const res = await fetch(`/api/leagues/${id}`);
    if (!res.ok) throw new Error("Failed to reload league");

    const fresh: LeagueDetail = await res.json();
    setLocalLeague(fresh);
  }

  async function handleManualStandingsUpdated() {
    await reloadLeague();
  }

  async function handleRegenerateManualStandings() {
    setRegeneratingRankings(true);

    try {
      const res = await fetch(`/api/leagues/${id}/generate-rankings`, {
        method: "POST",
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(result?.error ?? "Failed to regenerate rankings");
      }

      await reloadLeague();
    } finally {
      setRegeneratingRankings(false);
    }
  }

  async function handleInfoSave() {
    if (!infoForm.name.trim()) return;

    setInfoSaving(true);
    try {
      const res = await fetch(`/api/leagues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: infoForm.name.trim(),
          description: infoForm.description || null,
          logoUrl: infoForm.logoUrl || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update league");

      const updated: LeagueDetail = await res.json();
      setLocalLeague(updated);
      setInfoEditing(false);
    } finally {
      setInfoSaving(false);
    }
  }

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

  function resetTeamChanges() {
    if (!localLeague || !allTeams) return;
    const enrolledIds = new Set(localLeague.teams.map((t) => t.teamId));
    setLocalEnrolled(
      localLeague.teams.map((t) => t.team).filter(Boolean) as Team[]
    );
    setLocalAvailable(allTeams.filter((t) => !enrolledIds.has(t.id)));
  }

  async function handleTeamBulkSave() {
    setBulkSaving(true);
    try {
      const res = await fetch(`/api/leagues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds: localEnrolled.map((t) => t.id) }),
      });

      if (!res.ok) throw new Error("Failed to update league teams");

      const updated: LeagueDetail = await res.json();
      setLocalLeague(updated);
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleAssignTournament() {
    if (!selectedTournamentId) return;

    setAssigningSaving(true);
    try {
      const tournamentId = parseInt(selectedTournamentId, 10);
      const leagueId = parseInt(id, 10);

      const res = await fetch(`/api/tournaments/${selectedTournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId }),
      });

      if (
        await handleMissingEntity(res, {
          entityName: "tournament",
          action: "update",
          reload: reloadLeague,
          onMissing: () => {
            setLocalAllTournaments((prev) =>
              prev.filter((t) => t.id !== tournamentId)
            );
            closeTournamentModal();
          },
        })
      ) {
        return;
      }

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(result?.error ?? "Failed to assign tournament");
      }

      setLocalAllTournaments((prev) =>
        prev.map((t) => (t.id === tournamentId ? { ...t, leagueId } : t))
      );

      closeTournamentModal();
      await reloadLeague();
    } finally {
      setAssigningSaving(false);
    }
  }

  async function handleDetachTournament(tournamentId: number) {
    setDetaching(tournamentId);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId: null }),
      });

      if (
        await handleMissingEntity(res, {
          entityName: "tournament",
          action: "update",
          reload: reloadLeague,
          onMissing: () => {
            setLocalAllTournaments((prev) =>
              prev.filter((t) => t.id !== tournamentId)
            );
            setTournamentToDetachId(null);
          },
        })
      ) {
        return true;
      }

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(result?.error ?? "Failed to detach tournament");
      }

      setLocalAllTournaments((prev) =>
        prev.map((t) =>
          t.id === tournamentId ? { ...t, leagueId: null } : t
        )
      );

      await reloadLeague();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setDetaching(null);
    }
  }

  async function confirmDetachTournament() {
    if (tournamentToDetachId == null) return;

    const ok = await handleDetachTournament(tournamentToDetachId);

    if (ok) {
      setTournamentToDetachId(null);
    }
  }

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100";

  if (loading && !localLeague) {
    return <LeagueDetailSkeleton />;
  }

  if (error && !localLeague) {
    return <LeagueNotFoundState />;
  }

  if (!localLeague) {
    return null;
  }

  const league = localLeague;
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "tournaments", label: "Tournaments", count: league.tournaments.length },
    { key: "teams", label: "Teams", count: league.teams.length },
    {
      key: "manual-standings",
      label: "Manual standings",
      count: league.manualStandingTables?.length ?? 0,
    },
    { key: "info", label: "Info" },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <LeaguePageHeader
        league={league}
        activeTab={activeTab}
        tabs={tabs}
        onTabChange={setActiveTab}
      />

      {activeTab === "tournaments" && (
        <section className="space-y-4">
          <DivisionFilterChips
            divisions={assignedDivisions}
            value={divisionFilter}
            onChange={setDivisionFilter}
            includeAll
            includeUnassigned
            highlightInactive
          />

          <LeagueTournamentsTab
            tournaments={filteredLeagueTournaments}
            detaching={detaching}
            onAssignClick={() => setTournamentModalOpen(true)}
            onDetach={setTournamentToDetachId}
          />
        </section>
      )}

      {activeTab === "teams" && (
        <TeamsTransferTab
          availableTeams={localAvailable}
          selectedTeams={localEnrolled}
          pendingChanges={pendingTeamChanges}
          saving={bulkSaving}
          emptyAvailableText="All teams enrolled"
          emptySelectedText="No teams enrolled"
          onAddTeam={moveToEnrolled}
          onRemoveTeam={moveToAvailable}
          onAddAll={enrollAll}
          onRemoveAll={removeAll}
          onReset={resetTeamChanges}
          onSave={handleTeamBulkSave}
        />
      )}

      {activeTab === "manual-standings" && (
        <LeagueManualRankingsTab
          leagueId={league.id}
          tables={sortedManualStandingTables}
          leagueTeams={league.teams}
          onUpdated={handleManualStandingsUpdated}
          onRegenerate={handleRegenerateManualStandings}
          regenerating={regeneratingRankings}
        />
      )}

      {activeTab === "info" && (
        <LeagueInfoTab
          league={league}
          assignedDivisions={assignedDivisions}
          infoEditing={infoEditing}
          infoForm={infoForm}
          infoSaving={infoSaving}
          inputCls={inputCls}
          onEdit={() => setInfoEditing(true)}
          onCancel={() => setInfoEditing(false)}
          onSubmit={(e) => {
            e.preventDefault();
            handleInfoSave();
          }}
          onChange={(patch) => setInfoForm((prev) => ({ ...prev, ...patch }))}
        />
      )}

      <AssignTournamentModal
        open={tournamentModalOpen}
        selectedTournamentId={selectedTournamentId}
        tournaments={unassignedTournaments}
        assigningSaving={assigningSaving}
        inputCls={inputCls}
        onClose={closeTournamentModal}
        onChangeTournament={setSelectedTournamentId}
        onAssign={handleAssignTournament}
      />

      <ConfirmModal
        open={tournamentToDetachId != null}
        title={
          tournamentToDetach
            ? `Remove "${tournamentToDetach.name}" from this league?`
            : "Remove tournament from this league?"
        }
        description="This will only detach the tournament from the league. The tournament itself will remain unchanged."
        confirmLabel="Remove tournament"
        cancelLabel="Cancel"
        loading={detaching != null}
        onCancel={() => {
          if (detaching != null) return;
          setTournamentToDetachId(null);
        }}
        onConfirm={confirmDetachTournament}
      />
    </main>
  );
}