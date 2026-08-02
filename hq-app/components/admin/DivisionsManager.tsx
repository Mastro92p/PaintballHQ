"use client";

import React, { useEffect, useState } from "react";
import { handleMissingEntity } from "@/lib/handle-missing-entity";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";

interface Division {
  id: number;
  name: string;
  isActive: boolean;
  sortOrder?: number;
}

type DragEndHandler = NonNullable<
  React.ComponentProps<typeof DragDropProvider>["onDragEnd"]
>;

type DragEndEvent = Parameters<DragEndHandler>[0];

function DragHandle() {
  return (
    <span
      className="inline-flex cursor-grab items-center text-slate-400 active:cursor-grabbing dark:text-slate-500"
      aria-label="Drag to reorder"
      title="Drag to reorder"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <circle cx="6" cy="5" r="1.5" />
        <circle cx="6" cy="10" r="1.5" />
        <circle cx="6" cy="15" r="1.5" />
        <circle cx="14" cy="5" r="1.5" />
        <circle cx="14" cy="10" r="1.5" />
        <circle cx="14" cy="15" r="1.5" />
      </svg>
    </span>
  );
}

function SortableMobileCard({
  division,
  index,
  onToggle,
  onDelete,
}: {
  division: Division;
  index: number;
  onToggle: (division: Division) => void;
  onDelete: (division: Division) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: String(division.id),
    index,
  });

  return (
    <div
      ref={ref}
      className={`rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-slate-900/60 ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" ref={handleRef} className="touch-none">
            <DragHandle />
          </button>
          <span className="truncate font-medium text-slate-900 dark:text-white">
            {division.name}
          </span>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs ${
            division.isActive
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"
          }`}
        >
          {division.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onToggle(division)}
          className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
        >
          {division.isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(division)}
          className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function SortableDesktopRow({
  division,
  index,
  onToggle,
  onDelete,
}: {
  division: Division;
  index: number;
  onToggle: (division: Division) => void;
  onDelete: (division: Division) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: String(division.id),
    index,
  });

  return (
    <tr
      ref={ref}
      className={`border-t border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-200 ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" ref={handleRef} className="touch-none">
            <DragHandle />
          </button>
          <span className="font-medium text-slate-900 dark:text-white">{division.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            division.isActive
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"
          }`}
        >
          {division.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onToggle(division)}
          className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-300"
        >
          {division.isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(division)}
          className="text-xs font-medium text-rose-700 hover:underline dark:text-rose-400"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default function DivisionsManager() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [divisionToDelete, setDivisionToDelete] = useState<Division | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

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

  async function persistOrder(next: Division[], previous: Division[]) {
    setReordering(true);
    setError(null);

    try {
      const res = await fetch("/api/divisions/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: next.map((d) => d.id),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to reorder divisions");
      }

      setDivisions(data?.divisions ?? next);
    } catch (err) {
      setDivisions(previous);
      setError(err instanceof Error ? err.message : "Failed to reorder divisions");
    } finally {
      setReordering(false);
    }
  }

  async function handleReorder(event: DragEndEvent) {
    const next = move(divisions, event) as Division[] | undefined;
    if (!next) return;

    const unchanged =
      next.length === divisions.length &&
      next.every((division, index) => division.id === divisions[index]?.id);

    if (unchanged) return;

    const previous = divisions;
    setDivisions(next);
    await persistOrder(next, previous);
  }

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

      setDivisions((prev) => [...prev, created]);
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
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          Drag and drop divisions to control their display order.
          {reordering ? " Saving order..." : ""}
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
        <DragDropProvider onDragEnd={handleReorder}>
          <>
            <div className="space-y-2 sm:hidden">
              {divisions.map((d, index) => (
                <SortableMobileCard
                  key={d.id}
                  division={d}
                  index={index}
                  onToggle={toggleActive}
                  onDelete={setDivisionToDelete}
                />
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
                  {divisions.map((d, index) => (
                    <SortableDesktopRow
                      key={d.id}
                      division={d}
                      index={index}
                      onToggle={toggleActive}
                      onDelete={setDivisionToDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        </DragDropProvider>
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