"use client";

import { useState, useMemo, useEffect } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { handleMissingEntity } from "@/lib/handle-missing-entity";
import type {
  Tournament,
  CreateTournamentBody,
  UpdateTournamentBody,
  FormatConfig,
  Division,
} from "@/types";
import { ManageTournamentsHeader } from "@/components/tournaments/ManageTournamentsHeader";
import { TournamentsFilters } from "@/components/tournaments/TournamentsFilters";
import { TournamentsTable } from "@/components/tournaments/TournamentsTable";
import {
  TournamentFormModal,
  type TournamentFormState,
  type TournamentFormErrors,
} from "@/components/tournaments/TournamentFormModal";
import {
  EMPTY_TOURNAMENT_FORM,
  MANUAL_UNLIMITED,
  STATUS_LABELS,
  STATUS_VARIANT,
} from "@/components/tournaments/tournament-form.constants";

function hydrateTournament(
  tournament: Tournament,
  divisions?: Division[] | null
): Tournament {
  return {
    ...tournament,
    division:
      tournament.divisionId != null
        ? divisions?.find((d) => d.id === tournament.divisionId) ??
          tournament.division ??
          null
        : null,
    location: tournament.location ?? null,
    formatConfig: tournament.formatConfig ?? null,
  };
}

export default function ManageTournamentsPage() {
  const { data, loading, error } = useFetch<Tournament[]>("/api/tournaments");
  const { data: divisions } = useFetch<Division[]>("/api/divisions");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [form, setForm] = useState<TournamentFormState>(EMPTY_TOURNAMENT_FORM);
  const [formErrors, setFormErrors] = useState<TournamentFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [localTournaments, setLocalTournaments] = useState<Tournament[]>([]);

  const filtered = useMemo(() => {
    return localTournaments
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .filter((t) => {
        if (divisionFilter === "all") return true;
        if (divisionFilter === "unassigned") return t.divisionId == null;
        return t.divisionId === Number(divisionFilter);
      });
  }, [localTournaments, search, divisionFilter]);

  useEffect(() => {
    if (!data) return;

    setLocalTournaments((prev) =>
      prev.length === 0 ? data.map((t) => hydrateTournament(t, divisions)) : prev
    );
  }, [data, divisions]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_TOURNAMENT_FORM });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(t: Tournament) {
    setEditing(t);
    const fc = (t.formatConfig ?? {}) as Partial<FormatConfig>;

    setForm({
      name: t.name ?? "",
      date: t.date?.slice(0, 10) ?? "",
      location: t.location ?? "",
      status: t.status ?? "upcoming",
      type: t.type ?? "round_robin",
      divisionId: t.divisionId != null ? String(t.divisionId) : "",
      managementMode: t.managementMode ?? "auto",
      groupCount: String(fc.groupCount ?? 2),
      teamsPerGroup: String(fc.teamsPerGroup ?? 4),
      qualifiersPerGroup: String(fc.qualifiersPerGroup ?? 2),
      wildCardCount: String(fc.wildCardCount ?? 2),
      bracketSeedingRule: fc.bracketSeedingRule ?? "crossover",
      thirdPlaceMatch: fc.thirdPlaceMatch ?? false,
    });

    setFormErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm({ ...EMPTY_TOURNAMENT_FORM });
    setFormErrors({});
  }

  function validate(): boolean {
    const errors: TournamentFormErrors = {};

    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.date) errors.date = "Date is required";
    if (!form.location.trim()) errors.location = "Location is required";

    if (form.type === "group_and_bracket" && form.managementMode === "auto") {
      if (!form.groupCount || parseInt(form.groupCount, 10) < 2) {
        errors.groupCount = "At least 2 groups required";
      }

      if (!form.teamsPerGroup || parseInt(form.teamsPerGroup, 10) < 2) {
        errors.teamsPerGroup = "At least 2 teams per group";
      }

      if (!form.qualifiersPerGroup || parseInt(form.qualifiersPerGroup, 10) < 1) {
        errors.qualifiersPerGroup = "At least 1 qualifier per group";
      }

      if (
        parseInt(form.qualifiersPerGroup || "0", 10) >=
        parseInt(form.teamsPerGroup || "0", 10)
      ) {
        errors.qualifiersPerGroup = "Must be less than teams per group";
      }

      if (parseInt(form.wildCardCount || "0", 10) < 0) {
        errors.wildCardCount = "Wild cards cannot be negative";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function reloadTournaments() {
    const res = await fetch("/api/tournaments");
    if (!res.ok) throw new Error("Failed to reload tournaments");

    const fresh: Tournament[] = await res.json();
    setLocalTournaments(fresh.map((t) => hydrateTournament(t, divisions)));
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);

    const isKnockout = form.type === "bracket" || form.type === "group_and_bracket";

    const body: CreateTournamentBody | UpdateTournamentBody = {
      name: form.name,
      date: form.date,
      location: form.location,
      status: form.status,
      type: form.type,
      divisionId: form.divisionId ? Number(form.divisionId) : null,
      ...(form.type === "group_and_bracket" && {
        managementMode: form.managementMode,
      }),
      ...(isKnockout && {
        formatConfig: {
          ...(form.type === "group_and_bracket" && {
            groupCount:
              form.managementMode === "manual"
                ? MANUAL_UNLIMITED
                : parseInt(form.groupCount || "0", 10),
            teamsPerGroup:
              form.managementMode === "manual"
                ? MANUAL_UNLIMITED
                : parseInt(form.teamsPerGroup || "0", 10),
            qualifiersPerGroup:
              form.managementMode === "manual"
                ? 2
                : parseInt(form.qualifiersPerGroup || "0", 10),
            wildCardCount:
              form.managementMode === "manual"
                ? 0
                : parseInt(form.wildCardCount || "0", 10),
            bracketSeedingRule: form.bracketSeedingRule,
          }),
          thirdPlaceMatch: form.thirdPlaceMatch,
        },
      }),
    };

    try {
      let savedTournament: Tournament;

      if (editing) {
        const res = await fetch(`/api/tournaments/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const result = await res.json().catch(() => null);

        if (
          await handleMissingEntity(res, {
            entityName: "tournament",
            action: "update",
            reload: reloadTournaments,
            onMissing: closeModal,
          })
        ) {
          return;
        }

        if (!res.ok) {
          throw new Error(result?.error ?? "Failed to update tournament");
        }

        savedTournament = hydrateTournament(
          {
            ...editing,
            ...(result?.tournament ?? result ?? {}),
            ...body,
          } as Tournament,
          divisions
        );

        setLocalTournaments((prev) =>
          prev.map((t) => (t.id === savedTournament.id ? savedTournament : t))
        );
      } else {
        const res = await fetch("/api/tournaments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const result = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(result?.error ?? "Failed to create tournament");
        }

        savedTournament = hydrateTournament(
          {
            ...(result?.tournament ?? result),
            ...body,
          } as Tournament,
          divisions
        );

        setLocalTournaments((prev) => [...prev, savedTournament]);
      }

      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this tournament?")) return;

    const previous = localTournaments;
    setDeleting(id);
    setLocalTournaments((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
      const result = await res.json().catch(() => null);

      if (
        await handleMissingEntity(res, {
          entityName: "tournament",
          action: "delete",
          reload: reloadTournaments,
        })
      ) {
        return;
      }

      if (!res.ok) {
        throw new Error(result?.error ?? "Failed to delete tournament");
      }
    } catch (err) {
      console.error(err);
      setLocalTournaments(previous);
    } finally {
      setDeleting(null);
    }
  }

  function inputCls(field: keyof TournamentFormState) {
    return `w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
      formErrors[field]
        ? "border-red-400 dark:border-red-500"
        : "border-gray-200 dark:border-gray-700"
    }`;
  }

  function setField<K extends keyof TournamentFormState>(
    key: K,
    value: TournamentFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <ManageTournamentsHeader onCreate={openCreate} />

      <TournamentsFilters
        search={search}
        onSearchChange={setSearch}
        divisionFilter={divisionFilter}
        onDivisionFilterChange={setDivisionFilter}
        divisions={divisions}
      />

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && !error && (
        <TournamentsTable
          tournaments={filtered}
          deleting={deleting}
          onEdit={openEdit}
          onDelete={handleDelete}
          statusVariant={STATUS_VARIANT}
          statusLabels={STATUS_LABELS}
        />
      )}

      <TournamentFormModal
        open={modalOpen}
        editing={editing}
        form={form}
        formErrors={formErrors}
        divisions={divisions}
        saving={saving}
        onClose={closeModal}
        onSubmit={handleSave}
        setField={setField}
        inputCls={inputCls}
      />
    </main>
  );
}