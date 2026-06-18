"use client";

import { useState, useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import type { Team, CreateTeamBody, UpdateTeamBody } from "@/types";

type FormState = {
  name: string;
  contact: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = { name: "", contact: "" };

export default function ManageTeamsPage() {
  const { data, loading, error, refetch } = useFetch<Team[]>("/api/teams");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
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

  function openEdit(t: Team) {
    setEditing(t);
    setForm({ name: t.name, contact: t.contact ?? "" });
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
    if (!form.name.trim()) errors.name = "Team name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    const body: CreateTeamBody | UpdateTeamBody = {
      name: form.name,
      contact: form.contact || undefined,
    };

    if (editing) {
      await fetch(`/api/teams/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/teams", {
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
    if (!confirm("Delete this team?")) return;
    setDeleting(id);
    await fetch(`/api/teams/${id}`, { method: "DELETE" });
    setDeleting(null);
    refetch();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
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

      {/* Search */}
      <input
        type="search"
        placeholder="Search teams..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:max-w-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
      />

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
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
                <th className="px-4 py-3 text-left">Team Name</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Registered</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    No teams found
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

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Team" : "New Team"}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
          className="space-y-4"
        >
          {/* Team Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }));
              }}
              className={`w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 ${
                formErrors.name
                  ? "border-red-400 dark:border-red-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              placeholder="e.g. Desert Eagles"
            />
            {formErrors.name && (
              <p className="text-xs text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="email or phone"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save Changes" : "Create Team"}
            </Button>
          </div>
        </form>
      </Modal>

    </main>
  );
}