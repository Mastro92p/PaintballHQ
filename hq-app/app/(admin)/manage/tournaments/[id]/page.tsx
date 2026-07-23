"use client";

import { use, useEffect, useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useTournamentSettingsState } from "@/hooks/useTournamentSettingsState";
import { useTournamentTeamsState } from "@/hooks/useTournamentTeamsState";
import { useTournamentGroupsState } from "@/hooks/useTournamentGroupsState";
import { useTournamentMatchesState } from "@/hooks/useTournamentMatchesState";

import { TeamsTab } from "@/components/tournament-detail/TeamsTab";
import { MatchesTab } from "@/components/tournament-detail/MatchesTab";
import { BracketTab } from "@/components/tournament-detail/BracketTab";
import { InfoTab } from "@/components/tournament-detail/InfoTab";
import { TournamentDetailHeader } from "@/components/tournament-detail/TournamentDetailHeader";
import { TournamentDetailLoading } from "@/components/tournament-detail/TournamentDetailLoading";
import { TournamentDetailNotFound } from "@/components/tournament-detail/TournamentDetailNotFound";

import { ConfirmModal } from "@/components/ui/ConfirmModal";
import MatchModal from "@/components/matches/MatchModal";
import { TournamentFormModal } from "@/components/tournaments/TournamentFormModal";

import type { Team, TournamentDetail, Tournament, Division } from "@/types";

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
  const { data: divisions } = useFetch<Division[]>("/api/divisions");

  const [activeTab, setActiveTab] = useState<Tab>("teams");
  const [localTournament, setLocalTournament] = useState<TournamentDetail | null>(null);

  const tournament = localTournament;

  useEffect(() => {
    if (!data) return;
    setLocalTournament(data);
  }, [data]);

  const {
    localAvailable,
    localEnrolled,
    bulkSaving,
    pendingEnrollChanges,
    enrolledTeams,
    moveToEnrolled,
    moveToAvailable,
    enrollAll,
    removeAll,
    resetEnrollChanges,
    handleBulkSave,
  } = useTournamentTeamsState({
    id,
    tournament,
    allTeams,
    setLocalTournament,
  });

  const {
    settingsOpen,
    setSettingsOpen,
    settingsSaving,
    settingsForm,
    settingsErrors,
    settingsInputCls,
    setSettingsField,
    openTournamentSettings,
    handleSaveTournamentSettings,
  } = useTournamentSettingsState({
    tournament,
    tournamentId: id,
    allTeams,
    onTournamentUpdated: (updatedTournament) => {
      setLocalTournament(updatedTournament);
    },
  });

  const {
    activeGroupTab,
    setActiveGroupTab,
    localGroups,
    resettingGroups,
    generatingGroups,
    assigningTeamId,
    teamGroups,
    groupToDelete,
    setGroupToDelete,
    deletingGroup,
    savingGroups,
    groupsError,
    groupNameById,
    handleResetGroups,
    handleAssignGroup,
    handleAddGroup,
    handleRenameGroup,
    handleDeleteGroup,
    confirmDeleteGroup,
    handleReorderGroups,
    handleGenerateGroups,
  } = useTournamentGroupsState({
    id,
    tournament,
    onGroupsUpdated: (groups) => {
      setLocalTournament((prev) => (prev ? { ...prev, groups } : prev));
    },
    onMatchesUpdated: (matches) => {
      setLocalTournament((prev) => (prev ? { ...prev, matches } : prev));
    },
    onStatusUpdated: (status) => {
      setLocalTournament((prev) => (prev ? { ...prev, status } : prev));
    },
  });

  const {
    localMatches,
    hasBracketMatches,
    hasGroupMatches,
    isClassic,
    canAddMatch,
    modalTeams,
    editModalTeams,

    matchToDelete,
    deletingMatch,
    matchModalOpen,
    setMatchModalOpen,
    matchForm,
    setMatchForm,
    matchErrors,
    setMatchErrors,
    matchSaving,

    editingMatch,
    setEditingMatch,
    editForm,
    setEditForm,
    editErrors,
    setEditErrors,
    editSaving,

    editingBracketMatch,
    bracketEditSaving,

    openAddMatch,
    handleAddMatch,
    openEditMatch,
    handleEditMatch,
    openBracketEdit,
    closeBracketEdit,
    handleSaveBracketEdit,
    handleDeleteMatch,
    confirmDeleteMatch,
    setMatchToDelete,
  } = useTournamentMatchesState({
    tournamentId: id,
    tournament,
    enrolledTeams,
    activeGroupTab,
    setActiveGroupTab,
    teamGroups,
    onMatchesUpdated: (matches) => {
      setLocalTournament((prev) => (prev ? { ...prev, matches } : prev));
    },
  });

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

  async function handleGenerateBracket() {
    if (!tournament) return;

    if (
      tournament.type === "round_robin" ||
      tournament.type === "round_robin_classic"
    ) {
      setBracketError("Bracket generation is not available for round robin tournaments");
      return;
    }

    if (!confirm("Generate bracket from current standings? This cannot be undone.")) {
      return;
    }

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
    return <TournamentDetailLoading />;
  }

  if (error || !data || !tournament) {
    return <TournamentDetailNotFound />;
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "teams", label: "Teams", count: tournament.teams.length },
    {
      key: "matches",
      label: "Matches",
      count: localMatches.filter((m) => m.phase === "group").length,
    },
    ...(tournament.type !== "round_robin" &&
    tournament.type !== "round_robin_classic"
      ? [
          {
            key: "bracket" as Tab,
            label: "Bracket",
            count: localMatches.filter((m) => m.phase !== "group").length,
          },
        ]
      : []),
    { key: "info", label: "Info" },
  ];

  const pageWidthClass =
    activeTab === "bracket" ? "max-w-[1500px]" : "max-w-4xl"; // to be used

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <TournamentDetailHeader
        tournament={tournament}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onEditSettings={openTournamentSettings}
      />

      {activeTab === "teams" && (
        <TeamsTab
          localAvailable={localAvailable}
          localEnrolled={localEnrolled}
          pendingEnrollChanges={pendingEnrollChanges}
          bulkSaving={bulkSaving}
          tournamentDivisionId={tournament.divisionId}
          tournamentDivisionName={tournament.division?.name ?? null}
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
          matches={localMatches}
          enrolledTeams={enrolledTeams}
          isGroupAndBracket={tournament.type === "group_and_bracket"}
          isClassic={isClassic}
          canAddMatch={canAddMatch}
          hasGroupMatches={hasGroupMatches}
          managementMode={tournament.managementMode ?? "auto"}
          formatConfig={tournament.formatConfig ?? null}
          groups={localGroups ?? []}
          activeGroupTab={activeGroupTab}
          setActiveGroupTab={setActiveGroupTab}
          teamGroups={teamGroups}
          groupNameById={groupNameById}
          assigningTeamId={assigningTeamId}
          generatingGroups={generatingGroups}
          resettingGroups={resettingGroups}
          savingGroups={savingGroups}
          groupsError={groupsError}
          deletingMatch={deletingMatch}
          onGenerateGroups={handleGenerateGroups}
          onResetGroups={handleResetGroups}
          onAddGroup={handleAddGroup}
          onRenameGroup={handleRenameGroup}
          onDeleteGroup={handleDeleteGroup}
          onReorderGroups={handleReorderGroups}
          onOpenAddMatch={openAddMatch}
          onAssignGroup={handleAssignGroup}
          onEditMatch={openEditMatch}
          onDeleteMatch={handleDeleteMatch}
        />
      )}

      {activeTab === "bracket" && (
        <BracketTab
          matches={localMatches}
          editableTeams={enrolledTeams}
          hasBracketMatches={hasBracketMatches}
          generatingBracket={generatingBracket}
          resettingBracket={resettingBracket}
          bracketError={bracketError}
          editingBracketMatch={editingBracketMatch}
          bracketEditSaving={bracketEditSaving}
          onGenerateBracket={handleGenerateBracket}
          onResetBracket={handleResetBracket}
          onOpenBracketEdit={openBracketEdit}
          onCloseBracketEdit={closeBracketEdit}
          onSaveBracketEdit={handleSaveBracketEdit}
        />
      )}

      {activeTab === "info" && <InfoTab data={tournament} />}

      <MatchModal
        open={matchModalOpen}
        title="Add Match"
        submitLabel="+ Add Match"
        loading={matchSaving}
        isClassic={isClassic}
        requireTeams
        teams={modalTeams}
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
        teams={editModalTeams}
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

      <ConfirmModal
        open={!!groupToDelete}
        title={groupToDelete ? `Delete group "${groupToDelete.name}"?` : "Delete group?"}
        description="This will delete its matches and unassign its teams."
        confirmLabel="Delete group"
        cancelLabel="Cancel"
        danger
        loading={deletingGroup != null}
        onCancel={() => {
          if (deletingGroup != null) return;
          setGroupToDelete(null);
        }}
        onConfirm={confirmDeleteGroup}
      />

      <ConfirmModal
        open={!!matchToDelete}
        title="Delete match?"
        description="This action cannot be undone."
        confirmLabel="Delete match"
        cancelLabel="Cancel"
        danger
        loading={deletingMatch != null}
        onCancel={() => {
          if (deletingMatch != null) return;
          setMatchToDelete(null);
        }}
        onConfirm={confirmDeleteMatch}
      />

      <TournamentFormModal
        open={settingsOpen}
        editing={localTournament as Tournament | null}
        form={settingsForm}
        formErrors={settingsErrors}
        divisions={divisions}
        saving={settingsSaving}
        onClose={() => {
          setSettingsOpen(false);
        }}
        onSubmit={handleSaveTournamentSettings}
        setField={setSettingsField}
        inputCls={settingsInputCls}
      />
    </main>
  );
}