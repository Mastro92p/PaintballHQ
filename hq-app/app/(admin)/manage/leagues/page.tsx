"use client";

import { useState, useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";
import type { League, CreateLeagueBody, UpdateLeagueBody } from "@/types";

type FormState = {
  name: string;
  description: string;
  logoUrl: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = { name: "", description: "", logoUrl: "" };

export default function ManageLeaguesPage() {
  const { data, loading, error, refetch } = useFetch<League[]>("/api/leagues");

  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<League | null>(null);
  const [form, setForm]               = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors]   = useState<FormErrors>({});
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState<number | null>(null);
  const [search, setSearch]           = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((l) =>
      l.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(l: League) {
    setEditing(l);
    setForm({
      name:        l.name,
      description: l.description ?? "",
      logoUrl:     l.logoUrl ?? "",
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
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const body: CreateLeagueBody | UpdateLeagueBody = {
      name:        form.name,
      description: form.description || undefined,
      logoUrl:     form.logoUrl || undefined,
    };
    if (editing) {
      await fetch(`/api/leagues/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/leagues", {
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
    if (!confirm("Delete this league? All associated tournaments will be unlinked.")) return;
    setDeleting(id);
    await fetch(`/api/leagues/${id}`, { method: "DELETE" });
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leagues</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage leagues
          </p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto whitespace-nowrap px-4 py-2">
          + New League
        </Button>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search leagues..."
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
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Tournaments</th>
                <th className="px-4 py-3 text-left">Teams</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    No leagues found
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr
                    key={l.id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {l.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {l.description ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 tabular-nums">
                      {l.tournaments?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 tabular-nums">
                      {l.teams?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/manage/leagues/${l.id}`}>
                          <Button variant="ghost" size="sm">Manage →</Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(l)}>
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deleting === l.id}
                          onClick={() => handleDelete(l.id)}
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
        title={editing ? "Edit League" : "New League"}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
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
              placeholder="League name"
            />
            {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls("description")}
              placeholder="Short description..."
              rows={3}
            />
          </div>

          {/* Logo URL */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Logo URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className={inputCls("logoUrl")}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save Changes" : "Create League"}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}