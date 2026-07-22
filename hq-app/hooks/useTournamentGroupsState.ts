import { useEffect, useMemo, useState } from "react";
import type { Match, TournamentDetail } from "@/types";

type UseTournamentGroupsStateParams = {
  id: string;
  tournament: TournamentDetail | null;
  onGroupsUpdated?: (groups: NonNullable<TournamentDetail["groups"]>) => void;
  onMatchesUpdated?: (matches: Match[]) => void;
  onStatusUpdated?: (status: TournamentDetail["status"]) => void;
};

export function useTournamentGroupsState({
  id,
  tournament,
  onGroupsUpdated,
  onMatchesUpdated,
  onStatusUpdated,
}: UseTournamentGroupsStateParams) {
  const [activeGroupTab, setActiveGroupTab] = useState<number | null>(null);
  const [localGroups, setLocalGroups] = useState<
    NonNullable<TournamentDetail["groups"]>
  >([]);
  const [resettingGroups, setResettingGroups] = useState(false);
  const [generatingGroups, setGeneratingGroups] = useState(false);
  const [assigningTeamId, setAssigningTeamId] = useState<number | null>(null);
  const [teamGroups, setTeamGroups] = useState<Record<number, number[]>>({});
  const [groupToDelete, setGroupToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<number | null>(null);
  const [savingGroups, setSavingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournament) {
      setTeamGroups({});
      return;
    }

    setTeamGroups(
      Object.fromEntries(
        tournament.teams.map((t) => [
          t.teamId,
          (t.groupLinks ?? [])
            .map((link) => link.groupId)
            .filter((groupId): groupId is number => typeof groupId === "number"),
        ])
      )
    );
  }, [tournament]);

  useEffect(() => {
    setLocalGroups(tournament?.groups ?? []);
  }, [tournament?.groups]);

  useEffect(() => {
    if (!localGroups.length) {
      setActiveGroupTab(null);
      return;
    }

    setActiveGroupTab((prev) =>
      prev != null && localGroups.some((g) => g.id === prev)
        ? prev
        : localGroups[0].id
    );
  }, [localGroups]);

  const groupNameById = useMemo<Record<number, string>>(() => {
    return Object.fromEntries(localGroups.map((g) => [g.id, g.name]));
  }, [localGroups]);

  async function handleResetGroups() {
    if (
      !confirm(
        "Delete all group stage matches and clear team group assignments? This cannot be undone."
      )
    ) {
      return;
    }

    setResettingGroups(true);
    setGroupsError(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/generate-groups`, {
        method: "DELETE",
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to reset groups");
      }

      const nextGroups = body.groups ?? [];
      const nextMatches = body.matches ?? [];
      const nextTeamGroups = body.teamGroups ?? {};

      setLocalGroups(nextGroups);
      setTeamGroups(nextTeamGroups);

      onGroupsUpdated?.(nextGroups);
      onMatchesUpdated?.(nextMatches);

      if (body.status) {
        onStatusUpdated?.(body.status);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to reset groups");
    } finally {
      setResettingGroups(false);
    }
  }

  async function handleAssignGroup(teamId: number, groupId: number | null) {
    setAssigningTeamId(teamId);

    const previousGroupIds = teamGroups[teamId] ?? [];

    const nextGroupIds =
      groupId === null
        ? previousGroupIds
        : previousGroupIds.includes(groupId)
        ? previousGroupIds.filter((g) => g !== groupId)
        : [...previousGroupIds, groupId];

    setTeamGroups((prev) => ({
      ...prev,
      [teamId]: nextGroupIds,
    }));

    try {
      const res = await fetch(`/api/tournaments/${id}/teams/group`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, groupIds: nextGroupIds }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        setTeamGroups((prev) => ({
          ...prev,
          [teamId]: previousGroupIds,
        }));

        alert(body.error ?? "Failed to assign group");
      }
    } catch (error) {
      console.error(error);

      setTeamGroups((prev) => ({
        ...prev,
        [teamId]: previousGroupIds,
      }));

      alert("Failed to assign group");
    } finally {
      setAssigningTeamId(null);
    }
  }

  async function handleAddGroup(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSavingGroups(true);

    const previousGroups = localGroups;
    const tempId = Date.now();

    const optimisticGroup = {
      id: tempId,
      name: trimmedName,
      order: localGroups.length,
    };

    setLocalGroups((prev) => [...prev, optimisticGroup as (typeof prev)[number]]);

    try {
      const res = await fetch(`/api/tournaments/${id}/groups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", name: trimmedName }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to add group");
      }

      const nextGroups = body.groups ?? previousGroups;
      setLocalGroups(nextGroups);
      onGroupsUpdated?.(nextGroups);
    } catch (error) {
      console.error(error);
      setLocalGroups(previousGroups);
      alert("Failed to add group");
    } finally {
      setSavingGroups(false);
    }
  }

  async function handleRenameGroup(groupId: number, newName: string) {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    setSavingGroups(true);

    const previousGroups = localGroups;

    setLocalGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, name: trimmedName } : group
      )
    );

    try {
      const res = await fetch(`/api/tournaments/${id}/groups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rename",
          groupId,
          newName: trimmedName,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to rename group");
      }

      const nextGroups = body.groups ?? previousGroups;
      setLocalGroups(nextGroups);
      onGroupsUpdated?.(nextGroups);
    } catch (error) {
      console.error(error);
      setLocalGroups(previousGroups);
      alert("Failed to rename group");
    } finally {
      setSavingGroups(false);
    }
  }

  function handleDeleteGroup(groupId: number) {
    const group = localGroups.find((g) => g.id === groupId);
    if (!group) return;

    setGroupToDelete({
      id: group.id,
      name: group.name,
    });
  }

  async function confirmDeleteGroup() {
    if (!groupToDelete) return;

    setSavingGroups(true);
    setDeletingGroup(groupToDelete.id);

    const previousGroups = localGroups;
    const deletingId = groupToDelete.id;

    setLocalGroups((prev) => prev.filter((group) => group.id !== deletingId));
    setGroupToDelete(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/groups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          groupId: deletingId,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to delete group");
      }

      const nextGroups = body.groups ?? previousGroups;
      const nextMatches = body.matches;

      setLocalGroups(nextGroups);
      onGroupsUpdated?.(nextGroups);

      if (nextMatches) {
        onMatchesUpdated?.(nextMatches);
      }
    } catch (error) {
      console.error(error);
      setLocalGroups(previousGroups);
      alert("Failed to delete group");
    } finally {
      setSavingGroups(false);
      setDeletingGroup(null);
    }
  }

  async function handleReorderGroups(groupIds: number[]) {
    setSavingGroups(true);

    try {
      const res = await fetch(`/api/tournaments/${id}/groups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          groupIds,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to reorder groups");
      }

      const nextGroups = body.groups ?? [];
      setLocalGroups(nextGroups);
      onGroupsUpdated?.(nextGroups);
    } catch (error) {
      console.error(error);
      alert("Failed to reorder groups");
    } finally {
      setSavingGroups(false);
    }
  }

  async function handleGenerateGroups() {
    if (!confirm("Generate group stage matches? This cannot be undone.")) {
      return;
    }

    setGeneratingGroups(true);
    setGroupsError(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/generate-groups`, {
        method: "POST",
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setGroupsError(body.error ?? "Failed to generate groups");
        return;
      }

      const nextGroups = body.groups ?? localGroups;
      const nextMatches = body.matches ?? [];
      const nextTeamGroups = body.teamGroups ?? {};

      setLocalGroups(nextGroups);
      setTeamGroups(nextTeamGroups);

      onGroupsUpdated?.(nextGroups);
      onMatchesUpdated?.(nextMatches);

      if (body.status) {
        onStatusUpdated?.(body.status);
      }
    } finally {
      setGeneratingGroups(false);
    }
  }

  return {
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
  };
}