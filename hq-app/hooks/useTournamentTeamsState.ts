import { useEffect, useMemo, useState } from "react";
import type { Team, TournamentDetail } from "@/types";

type UseTournamentTeamsStateParams = {
  id: string;
  tournament: TournamentDetail | null;
  allTeams: Team[] | null;
  setLocalTournament: React.Dispatch<React.SetStateAction<TournamentDetail | null>>;
};

export function useTournamentTeamsState({
  id,
  tournament,
  allTeams,
  setLocalTournament,
}: UseTournamentTeamsStateParams) {
  const [localAvailable, setLocalAvailable] = useState<Team[]>([]);
  const [localEnrolled, setLocalEnrolled] = useState<Team[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [originalEnrolledIds, setOriginalEnrolledIds] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (!tournament || !allTeams) return;

    const enrolledIds = new Set(tournament.teams.map((t) => t.teamId));

    setLocalEnrolled(
      tournament.teams
        .map((t) => t.team)
        .filter((team): team is Team => Boolean(team))
    );

    setLocalAvailable(allTeams.filter((team) => !enrolledIds.has(team.id)));
  }, [tournament, allTeams]);

  useEffect(() => {
    setOriginalEnrolledIds(new Set(tournament?.teams.map((t) => t.teamId) ?? []));
  }, [tournament?.teams]);

  const pendingEnrollChanges = useMemo(() => {
    const currentIds = new Set(localEnrolled.map((t) => t.id));

    if (currentIds.size !== originalEnrolledIds.size) return true;

    for (const teamId of currentIds) {
      if (!originalEnrolledIds.has(teamId)) return true;
    }

    return false;
  }, [localEnrolled, originalEnrolledIds]);

  const enrolledTeams = localEnrolled;

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

  async function handleBulkSave() {
    if (!tournament) return;

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

      setLocalTournament((prev) => {
        if (!prev) return prev;

        const nextTeams: TournamentDetail["teams"] = localEnrolled.map((team) => {
          const existing = prev.teams.find((t) => t.teamId === team.id);

          if (existing) {
            return {
              ...existing,
              team,
            };
          }

          return {
            tournamentId: prev.id,
            teamId: team.id,
            team,
            groupLinks: [],
          };
        });

        return {
          ...prev,
          teams: nextTeams,
        };
      });

      setOriginalEnrolledIds(new Set(currentIds));
    } catch (error) {
      console.error(error);
      setOriginalEnrolledIds(previousOriginalIds);
      alert("Failed to save team changes");
    } finally {
      setBulkSaving(false);
    }
  }

  return {
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
  };
}