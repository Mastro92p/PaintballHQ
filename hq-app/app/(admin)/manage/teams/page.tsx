"use client";

import { useState, useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import type { Team, CreateTeamBody, UpdateTeamBody, Division } from "@/types";

type FormState = {
  name: string;
  contact: string;
  divisionId: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = { name: "", contact: "", divisionId: "" };

export default function ManageTeamsPage() {
  const { data, loading, error, refetch } = useFetch<Team[]>("/api/teams");
  const { data: divisions } = useFetch<Division[]>("/api/divisions");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .filter((t) => {
        if (divisionFilter === "all") return true;
        if (divisionFilter === "unassigned") return t.divisionId == null;
        return t.divisionId === Number(divisionFilter);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, search, divisionFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
    setModalOpen(true);
  }

  function openEdit(t: Team) {
    setEditing(t);
    setForm({
      name: t.name,
      contact: t.contact ?? "",
      divisionId: t.divisionId != null ? String(t.divisionId) : "",
    });
    setFormErrors({});
    setLogoFile(null);
    setLogoPreview(t.logoUrl ?? null);
    setLogoError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
  }

  const MAX_LOGO_SIZE = 2 * 1024 * 1024;
  const MAX_LOGO_DIMENSION = 2000;
  const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

  function validateLogoFile(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
        resolve("Only PNG, JPEG, or WebP images are allowed");
        return;
      }
      if (file.size > MAX_LOGO_SIZE) {
        resolve("Image must be under 2MB");
        return;
      }
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width > MAX_LOGO_DIMENSION || img.height > MAX_LOGO_DIMENSION) {
          resolve(`Image must not exceed ${MAX_LOGO_DIMENSION}x${MAX_LOGO_DIMENSION}px`);
        } else {
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve("Could not read image file");
      };
      img.src = url;
    });
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
      divisionId: form.divisionId ? Number(form.divisionId) : null,
    };

    let teamId = editing?.id ?? null;

    if (editing) {
      await fetch(`/api/teams/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const created = await res.json();
      teamId = created.id;
    }

    if (teamId && logoFile) {
      await uploadLogo(teamId, logoFile);
    }

    setSaving(false);
    closeModal();
    refetch();
  }

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const err = await validateLogoFile(file);
    if (err) {
      setLogoError(err);
      return;
    }

    setLogoError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function uploadLogo(teamId: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    setUploadingLogo(true);
    try {
      await fetch(`/api/teams/${teamId}/logo`, { method: "POST", body: formData });
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    if (!editing) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    setRemovingLogo(true);
    await fetch(`/api/teams/${editing.id}/logo`, { method: "DELETE" });
    setRemovingLogo(false);
    setLogoFile(null);
    setLogoPreview(null);
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

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Team" : "New Team"}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
          className="space-y-4"
        >
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

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Division <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={form.divisionId}
              onChange={(e) => setForm({ ...form, divisionId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="">No division</option>
              {divisions?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Team Logo <span className="text-gray-400 font-normal">(optional)</span>
            </label>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Team logo preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">No logo</span>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                      {uploadingLogo ? "Uploading..." : "Choose file"}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={handleLogoSelect}
                    />
                  </label>
                  {logoPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      loading={removingLogo}
                      onClick={handleRemoveLogo}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-400">PNG, JPEG, or WebP. Max 2MB, 2000x2000px.</p>
                {logoError && <p className="text-xs text-red-500">{logoError}</p>}
              </div>
            </div>
          </div>

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