"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TeamsTab } from "@/components/tournament-detail/TeamsTab";
import { MatchesTab } from "@/components/tournament-detail/MatchesTab";
import { formatDate } from "@/lib/utils";
import type { Team, Match, CreateMatchBody } from "@/types";
import { BracketTab } from "@/components/tournament-detail/BracketTab";
import { InfoTab } from "@/components/tournament-detail/InfoTab";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
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

  const [localAvailable, setLocalAvailable] = useState<Team[]>([]);
  const [localEnrolled, setLocalEnrolled] = useState<Team[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [activeGroupTab, setActiveGroupTab] = useState<number | null>(null);
  const [localGroups, setLocalGroups] = useState<NonNullable<TournamentDetail["groups"]>>([]);

  const [resettingGroups, setResettingGroups] = useState(false);
  const [assigningTeamId, setAssigningTeamId] = useState<number | null>(null);

  const [teamGroups, setTeamGroups] = useState<Record<number, number[]>>({});

  const [groupToDelete, setGroupToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<number | null>(null);
  const [localMatches, setLocalMatches] = useState<Match[]>([]);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  const groupNameById = useMemo<Record<number, string>>(() => {
    return Object.fromEntries((localGroups ?? []).map((g) => [g.id, g.name]));
  }, [localGroups]);

  useEffect(() => {
    if (!data) {
      setTeamGroups({});
      return;
    }

    setTeamGroups(
      Object.fromEntries(
        data.teams.map((t) => [
          t.teamId,
          (t.groupLinks ?? [])
            .map((link) => link.groupId)
            .filter((groupId): groupId is number => typeof groupId === "number"),
        ])
      )
    );
  }, [data]);

  useEffect(() => {
    setLocalGroups(data?.groups ?? []);
  }, [data?.groups]);

  useEffect(() => {
    if (!localGroups.length) {
      setActiveGroupTab(null);
      return;
    }

    setActiveGroupTab((prev) =>
      prev != null && localGroups.some((g) => g.id === prev) ? prev : localGroups[0].id
    );
  }, [localGroups]);

  useEffect(() => {
    setLocalMatches(data?.matches ?? []);
  }, [data?.matches]);

  async function handleResetGroups() {
    if (
      !confirm(
        "Delete all group stage matches and clear team group assignments? This cannot be undone."
      )
    ) {
      return;
    }
    setResettingGroups(true);
    await fetch(`/api/tournaments/${id}/generate-groups`, { method: "DELETE" });
    setResettingGroups(false);
    refetch();
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
      setTeamGroups((prev) => ({
        ...prev,
        [teamId]: previousGroupIds,
      }));
      console.error(error);
      alert("Failed to assign group");
    } finally {
      setAssigningTeamId(null);
    }
  }

  useEffect(() => {
    if (!data || !allTeams) return;
    const enrolledIds = new Set(data.teams.map((t) => t.teamId));
    setLocalEnrolled(data.teams.map((t) => t.team).filter(Boolean) as Team[]);
    setLocalAvailable(allTeams.filter((t) => !enrolledIds.has(t.id)));
  }, [data, allTeams]);

  const [originalEnrolledIds, setOriginalEnrolledIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setOriginalEnrolledIds(new Set(data?.teams.map((t) => t.teamId) ?? []));
  }, [data?.teams]);

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
    if (!allTeams) return;

    const savedIds = originalEnrolledIds;

    setLocalEnrolled(allTeams.filter((t) => savedIds.has(t.id)));
    setLocalAvailable(allTeams.filter((t) => !savedIds.has(t.id)));
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

    const previousMatches = localMatches;

    setLocalMatches((prev) =>
      prev.map((match) =>
        match.id === matchId
          ? {
              ...match,
              teamAId,
              teamBId,
              scoreA: null,
              scoreB: null,
              status: "pending",
            }
          : match
      )
    );

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
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

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to update bracket match");
      }

      if (body.match) {
        setLocalMatches((prev) =>
          prev.map((match) =>
            match.id === matchId
              ? {
                  ...match,
                  ...body.match,
                }
              : match
          )
        );
      }

      setEditingBracketMatch(null);
    } catch (error) {
      console.error(error);
      setLocalMatches(previousMatches);
      alert("Failed to update bracket match");
    } finally {
      setBracketEditSaving(false);
    }
  }

  async function handleBulkSave() {
    if (!data) return;

    setBulkSaving(true);

    const previousOriginalIds = new Set(originalEnrolledIds);
    const currentIds = new Set(localEnrolled.map((t) => t.id));
    const toAdd = localEnrolled.filter((t) => !originalEnrolledIds.has(t.id));
    const toRemove = [...originalEnrolledIds].filter((teamId) => !currentIds.has(teamId));

    try {
      const results = await Promise.all([
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

      const failed = results.find((res) => !res.ok);

      if (failed) {
        throw new Error("Failed to save team changes");
      }

      setOriginalEnrolledIds(new Set(currentIds));
    } catch (error) {
      console.error(error);
      setOriginalEnrolledIds(previousOriginalIds);
      alert("Failed to save team changes");
    } finally {
      setBulkSaving(false);
    }
  }

  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchForm, setMatchForm] = useState<MatchForm>(emptyMatchForm);
  const [matchErrors, setMatchErrors] = useState<MatchFormErrors>({});
  const [matchSaving, setMatchSaving] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editForm, setEditForm] = useState<MatchForm>(emptyMatchForm);
  const [editErrors, setEditErrors] = useState<MatchFormErrors>({});
  const [editSaving, setEditSaving] = useState(false);
  const [deletingMatch, setDeletingMatch] = useState<number | null>(null);

  const [generatingGroups, setGeneratingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);
  const [resettingBracket, setResettingBracket] = useState(false);
  const [savingGroups, setSavingGroups] = useState(false);

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

      setLocalGroups(body.groups ?? previousGroups);
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
      prev.map((group) => (group.id === groupId ? { ...group, name: trimmedName } : group))
    );

    try {
      const res = await fetch(`/api/tournaments/${id}/groups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", groupId, newName: trimmedName }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to rename group");
      }

      setLocalGroups(body.groups ?? previousGroups);
    } catch (error) {
      console.error(error);
      setLocalGroups(previousGroups);
      alert("Failed to rename group");
    } finally {
      setSavingGroups(false);
    }
  }

  async function handleDeleteGroup(groupId: number) {
    const group = localGroups.find((g) => g.id === groupId);
    if (!group) return;

    setGroupToDelete({ id: group.id, name: group.name });
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
        body: JSON.stringify({ action: "delete", groupId: deletingId }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to delete group");
      }

      setLocalGroups(body.groups ?? previousGroups);
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
        body: JSON.stringify({ action: "reorder", groupIds }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to reorder groups");
      }

      setLocalGroups(body.groups ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingGroups(false);
    }
  }

  async function handleResetBracket() {
    if (!confirm("Delete the entire bracket? This cannot be undone.")) return;
    setResettingBracket(true);
    await fetch(`/api/tournaments/${id}/generate-bracket`, { method: "DELETE" });
    setResettingBracket(false);
    refetch();
  }

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

    const nextScoreA = scoreA !== "" ? parseInt(scoreA, 10) : null;
    const nextScoreB = scoreB !== "" ? parseInt(scoreB, 10) : null;
    const previousMatches = localMatches;

    setLocalMatches((prev) =>
      prev.map((match) =>
        match.id === matchId
          ? {
              ...match,
              scoreA: nextScoreA,
              scoreB: nextScoreB,
            }
          : match
      )
    );

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreA: nextScoreA,
          scoreB: nextScoreB,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to save bracket score");
      }

      if (body.match) {
        setLocalMatches((prev) =>
          prev.map((match) =>
            match.id === matchId
              ? {
                  ...match,
                  ...body.match,
                }
              : match
          )
        );
      }
    } catch (error) {
      console.error(error);
      setLocalMatches(previousMatches);
      alert("Failed to save bracket score");
    } finally {
      setSavingBracketMatch(null);
    }
  }

  const enrolledTeams = useMemo(() => {
    if (!data) return [];
    return data.teams.map((t) => t.team).filter(Boolean) as Team[];
  }, [data]);

  const matchesByRound = useMemo(() => {
    return localMatches
      .filter((m) => m.phase === "group")
      .reduce<Record<number, Match[]>>((acc, m) => {
        const r = m.round ?? 0;
        if (!acc[r]) acc[r] = [];
        acc[r].push(m);
        return acc;
      }, {});
  }, [localMatches]);

  const hasBracketMatches = useMemo(
    () => localMatches.some((m) => m.phase && m.phase !== "group"),
    [localMatches]
  );

  const hasGroupMatches = useMemo(
    () => localMatches.some((m) => m.phase === "group"),
    [localMatches]
  );

  const isGroupAndBracket = data?.type === "group_and_bracket";
  const isClassic = data?.type === "round_robin_classic";
  const canAddMatch =
    data?.type === "round_robin" ||
    data?.type === "round_robin_classic" ||
    (data?.type === "group_and_bracket" && data?.managementMode === "manual");

  const modalTeams = useMemo(() => {
    if (!isGroupAndBracket || activeGroupTab == null) return enrolledTeams;
    return enrolledTeams.filter((t) => (teamGroups[t.id] ?? []).includes(activeGroupTab));
  }, [isGroupAndBracket, enrolledTeams, teamGroups, activeGroupTab]);

  const editModalTeams = useMemo(() => {
    if (!isGroupAndBracket || !editingMatch) return enrolledTeams;
    const g = editingMatch.groupId ?? activeGroupTab;
    if (g == null) return enrolledTeams;
    return enrolledTeams.filter((t) => (teamGroups[t.id] ?? []).includes(g));
  }, [isGroupAndBracket, editingMatch, enrolledTeams, teamGroups, activeGroupTab]);

  function validateMatchForm(form: MatchForm): MatchFormErrors {
    const errors: MatchFormErrors = {};

    if (!form.teamAId) errors.teamAId = "Team A is required";
    if (!form.teamBId) errors.teamBId = "Team B is required";

    if (form.teamAId && form.teamBId && form.teamAId === form.teamBId) {
      errors.teamBId = "Team B must be different from Team A";
    }

    if (form.round.trim() !== "") {
      const round = parseInt(form.round, 10);
      if (Number.isNaN(round) || round < 1) {
        errors.round = "Round must be at least 1";
      }
    }

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
      round: matchForm.round.trim() !== "" ? parseInt(matchForm.round, 10) : null,
      label: matchForm.label.trim() || null,
      field: matchForm.field.trim() || null,
      scoreA: matchForm.scoreA !== "" ? parseInt(matchForm.scoreA, 10) : undefined,
      scoreB: matchForm.scoreB !== "" ? parseInt(matchForm.scoreB, 10) : undefined,
      bodyCountA:
        matchForm.bodyCountA !== "" ? parseInt(matchForm.bodyCountA, 10) : undefined,
      bodyCountB:
        matchForm.bodyCountB !== "" ? parseInt(matchForm.bodyCountB, 10) : undefined,
      phase: isGroupAndBracket ? "group" : undefined,
      groupId: isGroupAndBracket ? activeGroupTab : undefined,
    };

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const createdMatch = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error("Failed to add match");
      }

      if (createdMatch) {
        setLocalMatches((prev) => [...prev, createdMatch]);
      }

      setMatchModalOpen(false);
      setMatchForm(emptyMatchForm);
      setMatchErrors({});
    } catch (error) {
      console.error(error);
      alert("Failed to add match");
    } finally {
      setMatchSaving(false);
    }
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
      round: m.round != null ? String(m.round) : "",
      label: m.label ?? "",
      field: m.field ?? "",
    });
  }

  async function handleEditMatch() {
    const editOnlyErrors: MatchFormErrors = {};

    if (editForm.round.trim() !== "") {
      const round = parseInt(editForm.round, 10);
      if (Number.isNaN(round) || round < 1) {
        editOnlyErrors.round = "Round must be at least 1";
      }
    }

    if (editForm.teamAId && editForm.teamBId && editForm.teamAId === editForm.teamBId) {
      editOnlyErrors.teamBId = "Team B must be different from Team A";
    }

    if (Object.keys(editOnlyErrors).length > 0) {
      setEditErrors(editOnlyErrors);
      return;
    }

    if (!editingMatch) return;

    setEditSaving(true);

    const matchId = editingMatch.id;
    const previousMatches = localMatches;

    const nextTeamAId = parseInt(editForm.teamAId, 10);
    const nextTeamBId = parseInt(editForm.teamBId, 10);

    const nextScoreA = editForm.scoreA !== "" ? parseInt(editForm.scoreA, 10) : null;
    const nextScoreB = editForm.scoreB !== "" ? parseInt(editForm.scoreB, 10) : null;

    const nextStatus = nextScoreA !== null && nextScoreB !== null ? "completed" : "pending";



    const optimisticMatch = {
      ...editingMatch,
      teamAId: nextTeamAId,
      teamBId: nextTeamBId,
      teamA: enrolledTeams.find((t) => t.id === nextTeamAId) ?? null,
      teamB: enrolledTeams.find((t) => t.id === nextTeamBId) ?? null,
      scoreA: nextScoreA,
      scoreB: nextScoreB,
      bodyCountA: editForm.bodyCountA !== "" ? parseInt(editForm.bodyCountA, 10) : null,
      bodyCountB: editForm.bodyCountB !== "" ? parseInt(editForm.bodyCountB, 10) : null,
      round: editForm.round.trim() !== "" ? parseInt(editForm.round, 10) : null,
      label: editForm.label.trim() || null,
      field: editForm.field.trim() || null,
      status: nextStatus,
    };

    setLocalMatches((prev) =>
      prev.map((match) => (match.id === matchId ? optimisticMatch : match))
    );

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamAId: optimisticMatch.teamAId,
          teamBId: optimisticMatch.teamBId,
          scoreA: optimisticMatch.scoreA,
          scoreB: optimisticMatch.scoreB,
          bodyCountA: optimisticMatch.bodyCountA,
          bodyCountB: optimisticMatch.bodyCountB,
          round: optimisticMatch.round,
          label: optimisticMatch.label,
          field: optimisticMatch.field,
          status: optimisticMatch.status,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to update match");
      }

      if (body.match) {
            setLocalMatches((prev) =>
              prev.map((match) =>
                match.id === matchId
                  ? {
                      ...match,
                      ...body.match,
                      teamA:
                        body.match.teamA ??
                        enrolledTeams.find((t) => t.id === (body.match.teamAId ?? match.teamAId)) ??
                        match.teamA ??
                        null,
                      teamB:
                        body.match.teamB ??
                        enrolledTeams.find((t) => t.id === (body.match.teamBId ?? match.teamBId)) ??
                        match.teamB ??
                        null,
                      status:
                        body.match.status ??
                        ((body.match.scoreA ?? match.scoreA) != null &&
                        (body.match.scoreB ?? match.scoreB) != null
                          ? "completed"
                          : "pending"),
                    }
                  : match
              )
            );
          }

      setEditingMatch(null);
      setEditErrors({});
    } catch (error) {
      console.error(error);
      setLocalMatches(previousMatches);
      alert("Failed to update match");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeleteMatch(matchId: number) {
    const match = localMatches.find((m) => m.id === matchId);
    if (!match) return;

    setMatchToDelete(match);
  }

  async function confirmDeleteMatch() {
    if (!matchToDelete) return;

    const matchId = matchToDelete.id;
    const previousMatches = localMatches;

    setDeletingMatch(matchId);
    setLocalMatches((prev) => prev.filter((match) => match.id !== matchId));
    setMatchToDelete(null);

    try {
      const res = await fetch(`/api/matches/${matchId}`, { method: "DELETE" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete match");
      }
    } catch (error) {
      console.error(error);
      setLocalMatches(previousMatches);
      alert("Failed to delete match");
    } finally {
      setDeletingMatch(null);
    }
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
      count: localMatches.filter((m) => m.phase === "group").length,
    },
    ...(data.type !== "round_robin" && data.type !== "round_robin_classic"
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.name}</h1>
          <Badge variant={statusVariant[data.status] ?? "muted"}>{data.status}</Badge>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 capitalize">
            {(data.type ?? "round_robin").replace(/_/g, " ")}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {"Division: " + (data.division?.name ?? "Unassigned")}
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
          tournamentDivisionId={data.divisionId}
          tournamentDivisionName={data.division?.name ?? null}
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
          isGroupAndBracket={isGroupAndBracket}
          isClassic={isClassic}
          canAddMatch={canAddMatch}
          hasGroupMatches={hasGroupMatches}
          managementMode={data.managementMode ?? "auto"}
          formatConfig={data.formatConfig ?? null}
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
          onOpenAddMatch={(groupId) => {
            setMatchForm(emptyMatchForm);
            setMatchErrors({});
            if (groupId != null) setActiveGroupTab(groupId);
            setMatchModalOpen(true);
          }}
          onAssignGroup={handleAssignGroup}
          onEditMatch={openEditMatch}
          onDeleteMatch={handleDeleteMatch}
        />
      )}

      {activeTab === "bracket" && (
        <BracketTab
          matches={localMatches}
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
    </main>
  );
}