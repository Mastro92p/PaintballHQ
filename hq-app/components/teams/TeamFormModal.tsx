"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Team, CreateTeamBody, UpdateTeamBody, Division } from "@/types";
import { handleMissingEntity } from "@/lib/handle-missing-entity";

type FormState = {
  name: string;
  contact: string;
  divisionId: string;
};

type FormErrors = Partial<Record<keyof FormState, string>> & { general?: string };

const emptyForm: FormState = { name: "", contact: "", divisionId: "" };

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

type Props = {
  open: boolean;
  editing: Team | null;
  divisions: Division[] | null | undefined;
  onClose: () => void;
  onSaved: (team: Team, mode: "create" | "edit") => void;
  reloadTeams: () => Promise<void>;
};

export default function TeamFormModal({
  open,
  editing,
  divisions,
  onClose,
  onSaved,
  reloadTeams,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setForm({
        name: editing.name,
        contact: editing.contact ?? "",
        divisionId: editing.divisionId != null ? String(editing.divisionId) : "",
      });
      setLogoPreview(editing.logoUrl ?? null);
    } else {
      setForm(emptyForm);
      setLogoPreview(null);
    }

    setFormErrors({});
    setLogoFile(null);
    setLogoError(null);
  }, [open, editing]);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = "Team name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const err = await validateLogoFile(file);
    if (err) {
      setLogoError(err);
      return;
    }

    if (logoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
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
    if (logoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

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
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setFormErrors((p) => ({ ...p, general: undefined }));

    const body: CreateTeamBody | UpdateTeamBody = {
      name: form.name,
      contact: form.contact || undefined,
      divisionId: form.divisionId ? Number(form.divisionId) : null,
    };

    try {
      let savedTeam: Team | null = null;
      const mode: "create" | "edit" = editing ? "edit" : "create";

      if (editing) {
        const res = await fetch(`/api/teams/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => null);

        if (
          await handleMissingEntity(res, {
            entityName: "team",
            action: "update",
            reload: reloadTeams,
            onMissing: onClose,
            notify: (message) => {
              alert(message);
            },
          })
        ) {
          setSaving(false);
          return;
        }

        if (!res.ok) {
          setFormErrors({ general: data?.error ?? "Failed to update team" });
          setSaving(false);
          return;
        }

        const updated = data;

        savedTeam = {
          ...editing,
          ...(updated?.team ?? updated ?? {}),
          name: form.name,
          contact: form.contact || null,
          divisionId: form.divisionId ? Number(form.divisionId) : null,
        };
      } else {
        const res = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const message = data?.error ?? "Failed to create team";

          if (message.toLowerCase().includes("name")) {
            setFormErrors({ name: message });
          } else {
            setFormErrors({ general: message });
          }

          setSaving(false);
          return;
        }

        const created = await res.json();

        savedTeam = {
          ...(created?.team ?? created),
          name: created?.team?.name ?? created?.name ?? form.name,
          contact: created?.team?.contact ?? created?.contact ?? (form.contact || null),
          divisionId:
            created?.team?.divisionId ??
            created?.divisionId ??
            (form.divisionId ? Number(form.divisionId) : null),
        };
      }

      if (!savedTeam?.id) {
        setFormErrors({ general: "Team was saved, but no team payload was returned." });
        setSaving(false);
        return;
      }

      if (savedTeam.id && logoFile) {
        await uploadLogo(savedTeam.id, logoFile);
        savedTeam = {
          ...savedTeam,
          logoUrl: logoPreview ?? savedTeam.logoUrl ?? null,
        };
      }

      setSaving(false);
      onSaved(savedTeam, mode);
      onClose();
    } catch {
      setFormErrors({ general: "Something went wrong. Please try again." });
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Team" : "New Team"}>
      <div className="px-5 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          {formErrors.general && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {formErrors.general}
            </div>
          )}

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
              className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 ${
                formErrors.name
                  ? "border-red-400 dark:border-red-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              placeholder="e.g. Desert Eagles"
            />
            {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Division <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <select
              value={form.divisionId}
              onChange={(e) => setForm({ ...form, divisionId: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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
              Team Logo <span className="font-normal text-gray-400">(optional)</span>
            </label>

            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Team logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No logo</span>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
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

                <p className="text-xs text-gray-400">
                  PNG, JPEG, or WebP. Max 2MB, 2000x2000px.
                </p>
                {logoError && <p className="text-xs text-red-500">{logoError}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-gray-700 dark:bg-gray-900"
              placeholder="email or phone"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save Changes" : "Create Team"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}