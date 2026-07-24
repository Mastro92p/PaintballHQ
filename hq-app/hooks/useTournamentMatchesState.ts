"use client";

import { useEffect, useMemo, useState } from "react";
import type { CreateMatchBody, Match, Team, TournamentDetail } from "@/types";
import type {
  MatchForm,
  MatchFormErrors,
} from "@/components/matches/MatchModal";
import { emptyMatchForm } from "@/components/matches/MatchModal";

type Params = {
  tournamentId: string;
  tournament: TournamentDetail | null;
  enrolledTeams: Team[];
  activeGroupTab: number | null;
  setActiveGroupTab: (groupId: number | null) => void;
  teamGroups: Record<number, number[]>;
  onMatchesUpdated?: (matches: Match[]) => void;
};

type MatchSlot = "teamAId" | "teamBId";

type SaveBracketEditInput = {
  matchId: number;
  teamAId: number | null;
  teamBId: number | null;
  scoreA?: number | null;
  scoreB?: number | null;
};

export function useTournamentMatchesState({
  tournamentId,
  tournament,
  enrolledTeams,
  activeGroupTab,
  setActiveGroupTab,
  teamGroups,
  onMatchesUpdated,
}: Params) {
  const [localMatches, setLocalMatches] = useState<Match[]>([]);

  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<number | null>(null);

  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchForm, setMatchForm] = useState<MatchForm>(emptyMatchForm);
  const [matchErrors, setMatchErrors] = useState<MatchFormErrors>({});
  const [matchSaving, setMatchSaving] = useState(false);

  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editForm, setEditForm] = useState<MatchForm>(emptyMatchForm);
  const [editErrors, setEditErrors] = useState<MatchFormErrors>({});
  const [editSaving, setEditSaving] = useState(false);

  const [editingBracketMatch, setEditingBracketMatch] = useState<Match | null>(null);
  const [bracketEditSaving, setBracketEditSaving] = useState(false);

  useEffect(() => {
    setLocalMatches(tournament?.matches ?? []);
  }, [tournament?.matches]);

  function updateMatches(next: Match[] | ((prev: Match[]) => Match[])) {
    setLocalMatches((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      onMatchesUpdated?.(resolved);
      return resolved;
    });
  }

  const hasBracketMatches = useMemo(
    () => localMatches.some((m) => m.phase && m.phase !== "group"),
    [localMatches]
  );

  const hasGroupMatches = useMemo(
    () => localMatches.some((m) => m.phase === "group"),
    [localMatches]
  );

  const isGroupAndBracket = tournament?.type === "group_and_bracket";
  const isClassic = tournament?.type === "round_robin_classic";
  const canAddMatch =
    tournament?.type === "round_robin" ||
    tournament?.type === "round_robin_classic" ||
    (tournament?.type === "group_and_bracket" &&
      tournament?.managementMode === "manual");

  const modalTeams = useMemo(() => {
    if (!isGroupAndBracket || activeGroupTab == null) return enrolledTeams;
    return enrolledTeams.filter((t) =>
      (teamGroups[t.id] ?? []).includes(activeGroupTab)
    );
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

  function openAddMatch(groupId?: number | null) {
    setMatchForm(emptyMatchForm);
    setMatchErrors({});
    if (groupId != null) {
      setActiveGroupTab(groupId);
    }
    setMatchModalOpen(true);
  }

  async function handleAddMatch() {
    const errors = validateMatchForm(matchForm);
    if (Object.keys(errors).length > 0) {
      setMatchErrors(errors);
      return;
    }

    setMatchSaving(true);

    const body: CreateMatchBody = {
      tournamentId: parseInt(tournamentId, 10),
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
        updateMatches((prev) => [...prev, createdMatch]);
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
    const nextStatus =
      nextScoreA !== null && nextScoreB !== null ? "completed" : "pending";

    const optimisticMatch: Match = {
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

    updateMatches((prev) =>
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
        updateMatches((prev) =>
          prev.map((match) =>
            match.id === matchId
              ? {
                  ...match,
                  ...body.match,
                  teamA:
                    body.match.teamA ??
                    enrolledTeams.find(
                      (t) => t.id === (body.match.teamAId ?? match.teamAId)
                    ) ??
                    match.teamA ??
                    null,
                  teamB:
                    body.match.teamB ??
                    enrolledTeams.find(
                      (t) => t.id === (body.match.teamBId ?? match.teamBId)
                    ) ??
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
      updateMatches(previousMatches);
      alert("Failed to update match");
    } finally {
      setEditSaving(false);
    }
  }

  function openBracketEdit(match: Match) {
    setEditingBracketMatch(match);
  }

  function closeBracketEdit() {
    setEditingBracketMatch(null);
  }

  async function handleSaveBracketEdit({
    matchId,
    teamAId,
    teamBId,
    scoreA = null,
    scoreB = null,
  }: SaveBracketEditInput) {
    setBracketEditSaving(true);

    const previousMatches = localMatches;
    const existingMatch = localMatches.find((match) => match.id === matchId);

    const nextTeamA =
      teamAId != null
        ? enrolledTeams.find((team) => team.id === teamAId) ?? null
        : null;
    const nextTeamB =
      teamBId != null
        ? enrolledTeams.find((team) => team.id === teamBId) ?? null
        : null;

    const teamsChanged =
      !!existingMatch &&
      ((existingMatch.teamAId ?? null) !== teamAId ||
        (existingMatch.teamBId ?? null) !== teamBId);

    const nextScoreA = teamsChanged ? null : scoreA;
    const nextScoreB = teamsChanged ? null : scoreB;
    const nextStatus =
      nextScoreA != null && nextScoreB != null ? "completed" : "pending";

    updateMatches((prev) =>
      prev.map((match) =>
        match.id === matchId
          ? {
              ...match,
              teamAId,
              teamBId,
              teamA: nextTeamA,
              teamB: nextTeamB,
              scoreA: nextScoreA,
              scoreB: nextScoreB,
              status: nextStatus,
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
          scoreA: nextScoreA,
          scoreB: nextScoreB,
          status: nextStatus,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "Failed to update bracket match");
      }

      const updatedMatches: Match[] = Array.isArray(body.updatedMatches)
        ? body.updatedMatches
        : body.match
        ? [body.match]
        : body?.id
        ? [body as Match]
        : [];

      if (updatedMatches.length > 0) {
        updateMatches((prev) => {
          const map = new Map(prev.map((match) => [match.id, match]));

          for (const updated of updatedMatches) {
            const previous = map.get(updated.id);

            map.set(updated.id, {
              ...(previous ?? updated),
              ...updated,
              teamA:
                updated.teamA ??
                (updated.teamAId != null
                  ? enrolledTeams.find((team) => team.id === updated.teamAId) ?? null
                  : null),
              teamB:
                updated.teamB ??
                (updated.teamBId != null
                  ? enrolledTeams.find((team) => team.id === updated.teamBId) ?? null
                  : null),
            });
          }

          return Array.from(map.values());
        });
      }

      setEditingBracketMatch(null);
    } catch (error) {
      console.error(error);
      updateMatches(previousMatches);
      alert("Failed to update bracket match");
    } finally {
      setBracketEditSaving(false);
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
    updateMatches((prev) => prev.filter((match) => match.id !== matchId));
    setMatchToDelete(null);

    try {
      const res = await fetch(`/api/matches/${matchId}`, { method: "DELETE" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete match");
      }
    } catch (error) {
      console.error(error);
      updateMatches(previousMatches);
      alert("Failed to delete match");
    } finally {
      setDeletingMatch(null);
    }
  }

  return {
    localMatches,
    setLocalMatches: updateMatches,

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
  };
}