"use client";

import { useEffect, useState } from "react";
import { handleMissingEntity } from "@/lib/handle-missing-entity";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Division {
  id: number;
  name: string;
  isActive: boolean;
}

export default function DivisionsManager() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [divisionToDelete, setDivisionToDelete] = useState<Division | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDivisions() {
    setLoading(true);

    try {
      const res = await fetch("/api/divisions");
      if (!res.ok) throw new Error("Failed to load divisions");
      setDivisions(await res.json());
    } catch (err) {
      console.error(err);
      setError("Failed to load divisions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDivisions();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = newName.trim();
    if (!name) {
      setError("Name cannot be empty");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const created: Division = data?.division ?? data;

      setDivisions((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewName("");
    } catch (err) {
      console.error("create failed", err);
      setError(err instanceof Error ? err.message : "Failed to create division");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(division: Division) {
    setError(null);

    const previous = divisions;
    const optimistic = divisions.map((d) =>
      d.id === division.id ? { ...d, isActive: !d.isActive } : d
    );

    setDivisions(optimistic);

    try {
      const res = await fetch(`/api/divisions/${division.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !division.isActive }),
      });

      const data = await res.json().catch(() => ({}));

      if (
        await handleMissingEntity(res, {
          entityName: "division",
          action: "update",
          reload: loadDivisions,
        })
      ) {
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update division");
      }

      const updated: Division = data?.division ?? data;

      setDivisions((prev) =>
        prev.map((d) => (d.id === division.id ? { ...d, ...updated } : d))
      );
    } catch (err) {
      setDivisions(previous);
      setError(err instanceof Error ? err.message : "Failed to update division");
    }
  }

  async function handleDelete() {
    if (!divisionToDelete) return false;

    setError(null);

    const deletingDivision = divisionToDelete;
    const previous = divisions;

    setDeleting(deletingDivision.id);
    setDivisions((prev) => prev.filter((d) => d.id !== deletingDivision.id));

    try {
      const res = await fetch(`/api/divisions/${deletingDivision.id}`, {
        method: "DELETE",
      });

      const handledMissing = await handleMissingEntity(res, {
        entityName: "division",
        action: "delete",
        reload: loadDivisions,
        notify: (message) => setError(message),
      });

      if (handledMissing) {
        setDivisionToDelete(null);
        return true;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete division");
      }

      setDivisionToDelete(null);
      return true;
    } catch (err) {
      setDivisions(previous);
      setError(err instanceof Error ? err.message : "Failed to delete division");
      return false;
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Divisions
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage predefined divisions used for teams and tournaments.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. M3, X3, X5"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-white/10 dark:bg-slate-900/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-teal-500 dark:focus:ring-teal-500/20"
        />
        <button
          type="submit"
          disabled={submitting}
          className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30"
        >
          {submitting ? "Adding..." : "Add"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-500">
          Loading...
        </div>
      ) : divisions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-500">
          No divisions yet.
        </div>
      ) : (
        <>
          <div className="space-y-2 sm:hidden">
            {divisions.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-slate-900/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-slate-900 dark:text-white">
                    {d.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                      d.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"
                    }`}
                  >
                    {d.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(d)}
                    className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                  >
                    {d.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDivisionToDelete(d)}
                    className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60 sm:block">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {divisions.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-200"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {d.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          d.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"
                        }`}
                      >
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleActive(d)}
                        className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-300"
                      >
                        {d.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDivisionToDelete(d)}
                        className="text-xs font-medium text-rose-700 hover:underline dark:text-rose-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!divisionToDelete}
        title={
          divisionToDelete
            ? `Delete division "${divisionToDelete.name}"?`
            : "Delete division?"
        }
        description="This action cannot be undone."
        confirmLabel="Delete division"
        cancelLabel="Cancel"
        danger
        requireText="DELETE"
        loading={deleting != null}
        onCancel={() => {
          if (deleting != null) return;
          setDivisionToDelete(null);
        }}
        onConfirm={async () => {
          await handleDelete();
        }}
      />
    </div>
  );
}