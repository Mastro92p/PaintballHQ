"use client";

import { useMemo, useState } from "react";
import { useManageTournamentsCrud } from "@/hooks/useManageTournamentsCrud";
import { ManageTournamentsHeader } from "@/components/tournaments/ManageTournamentsHeader";
import { TournamentsFilters } from "@/components/tournaments/TournamentsFilters";
import { TournamentsTable } from "@/components/tournaments/TournamentsTable";
import { TournamentFormModal } from "@/components/tournaments/TournamentFormModal";
import type { Tournament } from "@/types";

function filterTournaments(
  tournaments: Tournament[],
  search: string,
  divisionFilter: string
) {
  return tournaments
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => {
      if (divisionFilter === "all") return true;
      if (divisionFilter === "unassigned") return t.divisionId == null;
      return t.divisionId === Number(divisionFilter);
    });
}

export default function ManageTournamentsPage() {
  const {
    loading,
    error,
    divisions,
    modalOpen,
    editing,
    form,
    formErrors,
    saving,
    deleting,
    localTournaments,
    openCreate,
    openEdit,
    closeModal,
    handleSave,
    handleDelete,
    inputCls,
    setField,
  } = useManageTournamentsCrud();

  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");

  const filtered = useMemo(
    () => filterTournaments(localTournaments, search, divisionFilter),
    [localTournaments, search, divisionFilter]
  );

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