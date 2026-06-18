"use client";

import { useState, useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Tournament, CreateTournamentBody, UpdateTournamentBody } from "@/types";

const STATUS_OPTIONS = ["upcoming", "active", "completed"] as const;

const statusVariant: Record<string, "default" | "success" | "warning" | "muted"> = {
  upcoming: "warning",
  active: "default",
  completed: "muted",
};

type FormState = {
  name: string;
  date: string;
  location: string;
  status: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  name: "",
  date: "",
  location: "",
  status: "upcoming",
};

export default function ManageTournamentsPage() {
  const { data, loading, error, refetch } = useFetch<Tournament[]>("/api/tournaments");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(t: Tournament) {
    setEditing(t);
    setForm({
      name: t.name,
      date: t.date.slice(0, 10),
      location: t.location ?? "",
      status: t.status,
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
  }

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.date) errors.date = "Date is required";
    if (!form.location.trim()) errors.location = "Location is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    const body: CreateTournamentBody | UpdateTournamentBody = {
      name: form.name,
      date: form.date,
      location: form.location,
      status: form.status as Tournament["status"],
    };

    if (editing) {
      await fetch(`/api/tournaments/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    closeModal();
    refetch();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this tournament?")) return;
    setDeleting(id);
    await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
    setDeleting(null);
    refetch();
  }

  function inputCls(field: keyof FormState) {
    return `w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 ${
      formErrors[field]
        ? "border-red-400 dark:border-red-500"
        : "border-gray-200 dark:border-gray-700"
    }`;
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tournaments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage tournaments
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="self-start sm:self-auto whitespace-nowrap px-4 py-2"
        >
          + New Tournament
        </Button>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search tournaments..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:max-w-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
      />

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    No tournaments found
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {t.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {t.location ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[t.status] ?? "muted"}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/manage/tournaments/${t.id}`}>
                          <Button variant="ghost" size="sm">Manage →</Button>
                        </Link>
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

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Tournament" : "New Tournament"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }));
              }}
              className={inputCls("name")}
              placeholder="Tournament name"
            />
            {formErrors.name && (
              <p className="text-xs text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => {
                setForm({ ...form, date: e.target.value });
                if (formErrors.date) setFormErrors((p) => ({ ...p, date: undefined }));
              }}
              className={inputCls("date")}
            />
            {formErrors.date && (
              <p className="text-xs text-red-500">{formErrors.date}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              value={form.location}
              onChange={(e) => {
                setForm({ ...form, location: e.target.value });
                if (formErrors.location) setFormErrors((p) => ({ ...p, location: undefined }));
              }}
              className={inputCls("location")}
              placeholder="City, Venue"
            />
            {formErrors.location && (
              <p className="text-xs text-red-500">{formErrors.location}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save Changes" : "Create Tournament"}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}