"use client";

import { use, useEffect, useMemo, useState } from "react";
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

type GenerateBracketInput = {
  advancingTeams?: number;
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
  const { data: divisions } = useFetch<Division[]>("/api/divisions");

  const [activeTab, setActiveTab] = useState<Tab>("teams");
  const [localTournament, setLocalTournament] = useState<TournamentDetail | null>(null);
  const [activeBracketId, setActiveBracketId] = useState<number | null>(null);

  const [resetGroupsConfirmOpen, setResetGroupsConfirmOpen] = useState(false);
  const [resetBracketConfirmOpen, setResetBracketConfirmOpen] = useState(false);
  const [generateBracketConfirmOpen, setGenerateBracketConfirmOpen] = useState(false);
  const [pendingGenerateBracketInput, setPendingGenerateBracketInput] =
    useState<GenerateBracketInput | undefined>(undefined);
  const [bracketToDelete, setBracketToDelete] = useState<number | null>(null);

  const tournament = localTournament;
  const brackets = tournament?.brackets ?? [];

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
    confirmResetGroups, 
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

  const activeBracketMatches = useMemo(
    () =>
      localMatches.filter(
        (m) => m.phase !== "group" && m.bracketId === activeBracketId
      ),
    [localMatches, activeBracketId]
  );

  const selectedBracketHasMatches = activeBracketMatches.length > 0;

  useEffect(() => {
    if (!tournament) return;

    if (activeBracketId != null && brackets.some((b) => b.id === activeBracketId)) {
      return;
    }

    if (brackets.length > 0) {
      setActiveBracketId(brackets[0].id);
    } else {
      setActiveBracketId(null);
    }
  }, [tournament, brackets, activeBracketId]);

  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);
  const [resettingBracket, setResettingBracket] = useState(false);
  const [renamingBracket, setRenamingBracket] = useState(false);
  const [deletingBracket, setDeletingBracket] = useState(false);

  async function handleReorderBrackets(bracketIds: number[]) {
    setBracketError(null);

    const previous = brackets;

    setLocalTournament((prev) =>
      prev
        ? {
            ...prev,
            brackets: (prev.brackets ?? [])
              .map((bracket) => ({
                ...bracket,
                sortOrder: bracketIds.indexOf(bracket.id),
              }))
              .sort((a, b) => a.sortOrder - b.sortOrder),
          }
        : prev
    );

    try {
      const res = await fetch(`/api/tournaments/${id}/brackets`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          bracketIds,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to reorder brackets");
      }

      const nextBrackets = body.brackets ?? [];
      setLocalTournament((prev) =>
        prev
          ? {
              ...prev,
              brackets: nextBrackets,
            }
          : prev
      );
    } catch (error) {
      console.error(error);
      setBracketError(
        error instanceof Error ? error.message : "Failed to reorder brackets"
      );

      setLocalTournament((prev) =>
        prev
          ? {
              ...prev,
              brackets: previous,
            }
          : prev
      );
    }
  }

  function handleResetBracket() {
    if (activeBracketId == null) {
      setBracketError("Select a bracket first");
      return;
    }

    setResetBracketConfirmOpen(true);
  }

  async function confirmResetBracket() {
    if (activeBracketId == null) {
      setBracketError("Select a bracket first");
      return;
    }

    setResettingBracket(true);
    setBracketError(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/generate-bracket`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bracketId: activeBracketId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setBracketError(body.error ?? "Failed to reset bracket");
      } else {
        setResetBracketConfirmOpen(false);
        refetch();
      }
    } finally {
      setResettingBracket(false);
    }
  }

  function handleGenerateBracket(input?: GenerateBracketInput) {
    if (!tournament) return;

    if (
      tournament.type === "round_robin" ||
      tournament.type === "round_robin_classic"
    ) {
      setBracketError("Bracket generation is not available for round robin tournaments");
      return;
    }

    if (activeBracketId == null) {
      setBracketError("Select a bracket first");
      return;
    }

    const isManual = (tournament.managementMode ?? "auto") === "manual";

    if (!isManual) {
      setPendingGenerateBracketInput(input);
      setGenerateBracketConfirmOpen(true);
      return;
    }

    return confirmGenerateBracket(input);
  }

  async function confirmGenerateBracket(input = pendingGenerateBracketInput) {
    if (!tournament) return;

    if (activeBracketId == null) {
      setBracketError("Select a bracket first");
      return;
    }

    const isManual = (tournament.managementMode ?? "auto") === "manual";

    setGeneratingBracket(true);
    setBracketError(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/generate-bracket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bracketId: activeBracketId,
          ...(isManual
            ? { advancingTeams: input?.advancingTeams }
            : input?.advancingTeams != null
            ? { advancingTeams: input.advancingTeams }
            : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setBracketError(body.error ?? "Failed to generate bracket");
      } else {
        setGenerateBracketConfirmOpen(false);
        setPendingGenerateBracketInput(undefined);
        refetch();
      }
    } finally {
      setGeneratingBracket(false);
    }
  }

  async function handleAddBracket() {
    setBracketError(null);

    const res = await fetch(`/api/tournaments/${id}/brackets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setBracketError(body.error ?? "Failed to create bracket");
      return;
    }

    const nextBracket = body.bracket ?? body.data ?? null;

    if (nextBracket) {
      setLocalTournament((prev) =>
        prev
          ? {
              ...prev,
              brackets: (prev.brackets ?? []).some((b) => b.id === nextBracket.id)
                ? prev.brackets ?? []
                : [...(prev.brackets ?? []), nextBracket],
            }
          : prev
      );
      setActiveBracketId(nextBracket.id);
      return;
    }

    await refetch();
  }

  function handleDeleteBracket(bracketId: number) {
    setBracketToDelete(bracketId);
  }

  async function confirmDeleteBracket() {
    if (bracketToDelete == null) return false;

    const deletingId = bracketToDelete;

    setDeletingBracket(true);
    setBracketError(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/brackets/${deletingId}`, {
        method: "DELETE",
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to delete bracket");
      }

      setLocalTournament((prev) =>
        prev
          ? {
              ...prev,
              brackets: (prev.brackets ?? []).filter((b) => b.id !== deletingId),
              matches: (prev.matches ?? []).filter((m) => m.bracketId !== deletingId),
            }
          : prev
      );

      setActiveBracketId((prev) => {
        if (prev !== deletingId) return prev;
        const remaining = brackets.filter((b) => b.id !== deletingId);
        return remaining[0]?.id ?? null;
      });

      setBracketToDelete(null);
      return true;
    } catch (error) {
      console.error(error);
      setBracketError(
        error instanceof Error ? error.message : "Failed to delete bracket"
      );
      return false;
    } finally {
      setDeletingBracket(false);
    }
  }

  async function handleRenameBracket(bracketId: number, name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setBracketError("Bracket name is required");
      return;
    }

    setRenamingBracket(true);
    setBracketError(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/brackets/${bracketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to rename bracket");
      }

      const updatedBracket = body.bracket ?? null;

      if (updatedBracket) {
        setLocalTournament((prev) =>
          prev
            ? {
                ...prev,
                brackets: (prev.brackets ?? []).map((b) =>
                  b.id === bracketId ? { ...b, ...updatedBracket } : b
                ),
              }
            : prev
        );
        return;
      }

      await refetch();
    } catch (error) {
      console.error(error);
      setBracketError(
        error instanceof Error ? error.message : "Failed to rename bracket"
      );
    } finally {
      setRenamingBracket(false);
    }
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

  const bracketToDeleteName =
    bracketToDelete != null
      ? brackets.find((b) => b.id === bracketToDelete)?.name ?? "this bracket"
      : null;

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
          onResetGroups={() => setResetGroupsConfirmOpen(true)}
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
          brackets={brackets}
          activeBracketId={activeBracketId}
          onSelectBracket={setActiveBracketId}
          onAddBracket={handleAddBracket}
          onRenameBracket={handleRenameBracket}
          onDeleteBracket={handleDeleteBracket}
          onReorderBrackets={handleReorderBrackets}
          renamingBracket={renamingBracket}
          deletingBracket={deletingBracket}
          matches={activeBracketMatches}
          editableTeams={enrolledTeams}
          hasBracketMatches={selectedBracketHasMatches}
          generatingBracket={generatingBracket}
          resettingBracket={resettingBracket}
          bracketError={bracketError}
          editingBracketMatch={editingBracketMatch}
          bracketEditSaving={bracketEditSaving}
          managementMode={tournament.managementMode ?? "auto"}
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
        requireText="DELETE"
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
        requireText="DELETE"
        loading={deletingMatch != null}
        onCancel={() => {
          if (deletingMatch != null) return;
          setMatchToDelete(null);
        }}
        onConfirm={confirmDeleteMatch}
      />

      <ConfirmModal
        open={resetBracketConfirmOpen}
        title="Reset bracket?"
        description="This will remove all matches from the selected bracket. This action cannot be undone."
        confirmLabel="Reset bracket"
        cancelLabel="Cancel"
        danger
        requireText="DELETE"
        loading={resettingBracket}
        onCancel={() => {
          if (resettingBracket) return;
          setResetBracketConfirmOpen(false);
        }}
        onConfirm={confirmResetBracket}
      />

      <ConfirmModal
        open={generateBracketConfirmOpen}
        title="Generate bracket from current standings?"
        description="This will create or replace the bracket from the current standings."
        confirmLabel="Generate bracket"
        cancelLabel="Cancel"
        danger
        loading={generatingBracket}
        onCancel={() => {
          if (generatingBracket) return;
          setGenerateBracketConfirmOpen(false);
          setPendingGenerateBracketInput(undefined);
        }}
        onConfirm={() => confirmGenerateBracket()}
      />

      <ConfirmModal
        open={bracketToDelete != null}
        title={
          bracketToDeleteName
            ? `Delete bracket "${bracketToDeleteName}"?`
            : "Delete bracket?"
        }
        description="This will remove the bracket and all of its matches."
        confirmLabel="Delete bracket"
        cancelLabel="Cancel"
        danger
        requireText="DELETE"
        loading={deletingBracket}
        onCancel={() => {
          if (deletingBracket) return;
          setBracketToDelete(null);
        }}
        onConfirm={async () => {
          const ok = await confirmDeleteBracket();
          if (ok) {
            setBracketToDelete(null);
          }
        }}
      />


      <ConfirmModal
        open={resetGroupsConfirmOpen}
        title="Reset groups?"
        description="This will delete all group stage matches and clear team group assignments. This action cannot be undone."
        confirmLabel="Reset groups"
        cancelLabel="Cancel"
        danger
        requireText="DELETE"
        loading={resettingGroups}
        onCancel={() => {
          if (resettingGroups) return;
          setResetGroupsConfirmOpen(false);
        }}
        onConfirm={async () => {
          await confirmResetGroups();
          setResetGroupsConfirmOpen(false);
        }}
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