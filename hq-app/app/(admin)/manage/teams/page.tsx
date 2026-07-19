"use client";

import { useState, useMemo, useEffect } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/Button";
import TeamFormModal from "@/components/teams/TeamFormModal";
import { formatDate } from "@/lib/utils";
import type { Team, Division } from "@/types";

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
    setLocalTeams((data ?? []).map((team) => hydrateTeam(team, divisions)));
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

  async function handleDelete(id: number) {
    if (!confirm("Delete this team?")) return;

    const previous = localTeams;
    setDeleting(id);
    setLocalTeams((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete team");
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

      return prev.map((t) => (t.id === hydrated.id ? hydrated : t));
    });

    closeModal();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Teams
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage teams
          </p>
        </div>
        <Button onClick={openCreate}>+ New Team</Button>
      </div>

      <div className="space-y-3">
        <input
          type="search"
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDivisionFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              divisionFilter === "all"
                ? "bg-teal-700 text-white border-teal-700"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            All
          </button>

          {divisions?.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDivisionFilter(String(d.id))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                divisionFilter === String(d.id)
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {d.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setDivisionFilter("unassigned")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              divisionFilter === "unassigned"
                ? "bg-teal-700 text-white border-teal-700"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Unassigned
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Logo</th>
                <th className="px-4 py-3 text-left">Team Name</th>
                <th className="px-4 py-3 text-left">Division</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Registered</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No teams found
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                        {t.logoUrl ? (
                          <img
                            src={t.logoUrl}
                            alt={`${t.name} logo`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 text-center leading-tight">
                            No logo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {t.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {t.division?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {t.contact ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deleting === t.id}
                          onClick={() => handleDelete(t.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <TeamFormModal
        open={modalOpen}
        editing={editing}
        divisions={divisions}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </main>
  );
}