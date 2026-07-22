"use client";

import { useState } from "react";
import type {
  FormatConfig,
  Team,
  Tournament,
  TournamentDetail,
  UpdateTournamentBody,
} from "@/types";
import {
  EMPTY_TOURNAMENT_FORM,
  MANUAL_UNLIMITED,
} from "@/components/tournaments/tournament-form.constants";
import type {
  TournamentFormErrors,
  TournamentFormState,
} from "@/components/tournaments/TournamentFormModal";

type Args = {
  tournament: TournamentDetail | null;
  tournamentId: string;
  allTeams?: Team[] | null;
  onTournamentUpdated: (tournament: TournamentDetail) => void;
  onTeamsRecomputed?: (args: {
    enrolled: Team[];
    available: Team[];
    enrolledIds: Set<number>;
  }) => void;
};

export function useTournamentSettingsState({
  tournament,
  tournamentId,
  allTeams,
  onTournamentUpdated,
  onTeamsRecomputed,
}: Args) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsForm, setSettingsForm] =
    useState<TournamentFormState>(EMPTY_TOURNAMENT_FORM);
  const [settingsErrors, setSettingsErrors] =
    useState<TournamentFormErrors>({});

  function settingsInputCls(field: keyof TournamentFormState) {
    return `w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
      settingsErrors[field]
        ? "border-red-400 dark:border-red-500"
        : "border-gray-200 dark:border-gray-700"
    }`;
  }

  function setSettingsField<K extends keyof TournamentFormState>(
    key: K,
    value: TournamentFormState[K]
  ) {
    setSettingsForm((prev) => ({ ...prev, [key]: value }));

    if (settingsErrors[key]) {
      setSettingsErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validateTournamentSettings() {
    const errors: TournamentFormErrors = {};

    if (!settingsForm.name.trim()) errors.name = "Name is required";
    if (!settingsForm.date) errors.date = "Date is required";
    if (!settingsForm.location.trim()) errors.location = "Location is required";

    if (
      settingsForm.type === "group_and_bracket" &&
      settingsForm.managementMode === "auto"
    ) {
      if (!settingsForm.groupCount || parseInt(settingsForm.groupCount, 10) < 2) {
        errors.groupCount = "At least 2 groups required";
      }

      if (
        !settingsForm.teamsPerGroup ||
        parseInt(settingsForm.teamsPerGroup, 10) < 2
      ) {
        errors.teamsPerGroup = "At least 2 teams per group";
      }

      if (
        !settingsForm.qualifiersPerGroup ||
        parseInt(settingsForm.qualifiersPerGroup, 10) < 1
      ) {
        errors.qualifiersPerGroup = "At least 1 qualifier per group";
      }

      if (
        parseInt(settingsForm.qualifiersPerGroup || "0", 10) >=
        parseInt(settingsForm.teamsPerGroup || "0", 10)
      ) {
        errors.qualifiersPerGroup = "Must be less than teams per group";
      }

      if (parseInt(settingsForm.wildCardCount || "0", 10) < 0) {
        errors.wildCardCount = "Wild cards cannot be negative";
      }
    }

    setSettingsErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openTournamentSettings() {
    if (!tournament) return;

    const fc = (tournament.formatConfig ?? {}) as Partial<FormatConfig>;

    setSettingsForm({
      name: tournament.name ?? "",
      date: tournament.date?.slice(0, 10) ?? "",
      location: tournament.location ?? "",
      status: tournament.status ?? "upcoming",
      type: (tournament.type as Tournament["type"]) ?? "round_robin",
      divisionId: tournament.divisionId != null ? String(tournament.divisionId) : "",
      managementMode: tournament.managementMode ?? "auto",
      groupCount: String(fc.groupCount ?? 2),
      teamsPerGroup: String(fc.teamsPerGroup ?? 4),
      qualifiersPerGroup: String(fc.qualifiersPerGroup ?? 2),
      wildCardCount: String(fc.wildCardCount ?? 2),
      bracketSeedingRule: fc.bracketSeedingRule ?? "crossover",
      thirdPlaceMatch: fc.thirdPlaceMatch ?? false,
    });

    setSettingsErrors({});
    setSettingsOpen(true);
  }

  async function handleSaveTournamentSettings() {
    if (!tournament) return;
    if (!validateTournamentSettings()) return;

    setSettingsSaving(true);

    const isKnockout =
      settingsForm.type === "bracket" || settingsForm.type === "group_and_bracket";

    const body: UpdateTournamentBody = {
      name: settingsForm.name,
      date: settingsForm.date,
      location: settingsForm.location,
      status: settingsForm.status,
      type: settingsForm.type,
      divisionId: settingsForm.divisionId ? Number(settingsForm.divisionId) : null,
      ...(settingsForm.type === "group_and_bracket" && {
        managementMode: settingsForm.managementMode,
      }),
      ...(isKnockout && {
        formatConfig: {
          ...(settingsForm.type === "group_and_bracket" && {
            groupCount:
              settingsForm.managementMode === "manual"
                ? MANUAL_UNLIMITED
                : parseInt(settingsForm.groupCount || "0", 10),
            teamsPerGroup:
              settingsForm.managementMode === "manual"
                ? MANUAL_UNLIMITED
                : parseInt(settingsForm.teamsPerGroup || "0", 10),
            qualifiersPerGroup:
              settingsForm.managementMode === "manual"
                ? 2
                : parseInt(settingsForm.qualifiersPerGroup || "0", 10),
            wildCardCount:
              settingsForm.managementMode === "manual"
                ? 0
                : parseInt(settingsForm.wildCardCount || "0", 10),
            bracketSeedingRule: settingsForm.bracketSeedingRule,
          }),
          thirdPlaceMatch: settingsForm.thirdPlaceMatch,
        },
      }),
    };

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(result?.error ?? "Failed to update tournament");
      }

      const updatedTournament = (result?.tournament ?? result) as TournamentDetail;

      onTournamentUpdated(updatedTournament);

      if (allTeams && onTeamsRecomputed) {
        const enrolledIds = new Set(updatedTournament.teams.map((t) => t.teamId));
        const enrolled = updatedTournament.teams
          .map((t) => t.team)
          .filter(Boolean) as Team[];
        const available = allTeams.filter((t) => !enrolledIds.has(t.id));

        onTeamsRecomputed({
          enrolled,
          available,
          enrolledIds,
        });
      }

      setSettingsOpen(false);
      setSettingsErrors({});
    } catch (err) {
      console.error(err);
      alert("Failed to update tournament");
    } finally {
      setSettingsSaving(false);
    }
  }

  return {
    settingsOpen,
    setSettingsOpen,
    settingsSaving,
    settingsForm,
    settingsErrors,
    settingsInputCls,
    setSettingsField,
    openTournamentSettings,
    handleSaveTournamentSettings,
  };
}