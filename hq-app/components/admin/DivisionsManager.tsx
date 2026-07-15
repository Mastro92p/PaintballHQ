"use client";

import { useEffect, useState, type FormEvent } from "react";

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

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("handleCreate fired", newName);

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
      console.log("create response", res.status, data);

      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setNewName("");
      await loadDivisions();
    } catch (err) {
      console.error("create failed", err);
      setError(err instanceof Error ? err.message : "Failed to create division");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(division: Division) {
    setError(null);
    try {
      const res = await fetch(`/api/divisions/${division.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !division.isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update division");
      await loadDivisions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update division");
    }
  }

  async function handleDelete(division: Division) {
    if (!confirm(`Delete "${division.name}"?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/divisions/${division.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete division");
      await loadDivisions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete division");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Divisions</h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage predefined divisions used for teams and tournaments.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. M3, X3, X5"
          className="flex-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
            ) : divisions.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">No divisions yet.</td></tr>
            ) : (
              divisions.map((d) => (
                <tr key={d.id} className="border-t border-white/10 text-slate-200">
                  <td className="px-4 py-3 font-medium text-white">{d.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${d.isActive ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-500/10 text-slate-400"}`}>
                      {d.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => toggleActive(d)} className="text-xs text-amber-300 hover:underline">
                      {d.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleDelete(d)} className="text-xs text-rose-400 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}