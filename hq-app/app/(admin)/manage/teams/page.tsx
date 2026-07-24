"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";
import TeamFormModal from "@/components/teams/TeamFormModal";
import type { Team, Division } from "@/types";
import { ManageTeamsHeader } from "@/components/teams/ManageTeamsHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { DivisionFilterChips } from "@/components/divisions/DivisionFilterChips";
import { AdminTeamTable } from "@/components/teams/AdminTeamTable";
import { handleMissingEntity } from "@/lib/handle-missing-entity";

function hydrateTeam(team: Team, divisions?: Division[] | null): Team {
  const division =
    team.divisionId != null
      ? divisions?.find((d) => d.id === team.divisionId) ?? team.division ?? null
      : null;

  return {
    ...team,
    division,
    contact: team.contact ?? null,
    logoUrl: team.logoUrl ?? null,
  };
}

export default function ManageTeamsPage() {
  const { data, loading, error } = useFetch<Team[]>("/api/teams");
  const { data: divisions } = useFetch<Division[]>("/api/divisions");

  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  

  useEffect(() => {
    if (!data) return;
    setLocalTeams(data.map((team) => hydrateTeam(team, divisions)));
  }, [data, divisions]);

  const filtered = useMemo(() => {
    return localTeams
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .filter((t) => {
        if (divisionFilter === "all") return true;
        if (divisionFilter === "unassigned") return t.divisionId == null;
        return t.divisionId === Number(divisionFilter);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [localTeams, search, divisionFilter]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(t: Team) {
    setEditing(t);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  const reloadTeams = useCallback(async () => {
    const reloadRes = await fetch("/api/teams");
    if (!reloadRes.ok) throw new Error("Failed to reload teams");

    const fresh: Team[] = await reloadRes.json();
    setLocalTeams(fresh.map((team) => hydrateTeam(team, divisions)));
  }, [divisions]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this team?")) return;

    const previous = localTeams;
    setDeleting(id);
    setLocalTeams((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      const result = await res.json().catch(() => null);

      if (
        await handleMissingEntity(res, {
          entityName: "team",
          action: "delete",
          reload: reloadTeams,
        })
      ) {
        return;
      }

      if (!res.ok) {
        throw new Error(result?.error ?? "Failed to delete team");
      }
    } catch (error) {
      console.error(error);
      setLocalTeams(previous);
      alert("Failed to delete team");
    } finally {
      setDeleting(null);
    }
  }

  function handleSaved(team: Team, mode: "create" | "edit") {
    const hydrated = hydrateTeam(team, divisions);

    setLocalTeams((prev) => {
      if (mode === "create") {
        return [hydrated, ...prev];
      }

      const exists = prev.some((t) => t.id === hydrated.id);
      if (!exists) {
        return prev;
      }

      return prev.map((t) => (t.id === hydrated.id ? hydrated : t));
    });

    closeModal();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <ManageTeamsHeader onCreate={openCreate} />

      <div className="space-y-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search teams..."
        />

      <DivisionFilterChips
        divisions={divisions}
        value={divisionFilter}
        onChange={setDivisionFilter}
        includeAll
        includeUnassigned
        highlightInactive
      />
      </div>

      <AdminTeamTable
        teams={filtered}
        loading={loading}
        error={error}
        deleting={deleting}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <TeamFormModal
        open={modalOpen}
        editing={editing}
        divisions={divisions}
        onClose={closeModal}
        onSaved={handleSaved}
        reloadTeams={reloadTeams}
      />
    </main>
  );
}