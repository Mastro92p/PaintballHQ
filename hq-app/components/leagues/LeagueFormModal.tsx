"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { League, CreateLeagueBody, UpdateLeagueBody } from "@/types";
import { handleMissingEntity } from "@/lib/handle-missing-entity";

type FormState = {
  name: string;
  description: string;
  isHidden: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>> & { general?: string };

const emptyForm: FormState = {
  name: "",
  description: "",
  isHidden: false,
};

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
  editing: League | null;
  onClose: () => void;
  onSaved: (league: League, mode: "create" | "edit") => void;
  reloadLeagues: () => Promise<void>;
};

export function LeagueFormModal({
  open,
  editing,
  onClose,
  onSaved,
  reloadLeagues,
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
        description: editing.description ?? "",
        isHidden: Boolean(editing.isHidden),
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
    if (!form.name.trim()) errors.name = "League name is required";
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

  async function uploadLogo(leagueId: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    setUploadingLogo(true);

    try {
      const res = await fetch(`/api/leagues/${leagueId}/logo`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to upload logo");
      }

      return await res.json().catch(() => null);
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
    try {
      await fetch(`/api/leagues/${editing.id}/logo`, { method: "DELETE" });
      setLogoFile(null);
      setLogoPreview(null);
    } finally {
      setRemovingLogo(false);
    }
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setFormErrors((p) => ({ ...p, general: undefined }));

    const body: CreateLeagueBody | UpdateLeagueBody = editing
      ? {
          name: form.name.trim(),
          description: form.description.trim() || null,
          isHidden: form.isHidden,
        }
      : {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          isHidden: form.isHidden,
    };


    try {
      let savedLeague: League | null = null;
      const mode: "create" | "edit" = editing ? "edit" : "create";

      if (editing) {
        const res = await fetch(`/api/leagues/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => null);

        if (
          await handleMissingEntity(res, {
            entityName: "league",
            action: "update",
            reload: reloadLeagues,
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
          setFormErrors({ general: data?.error ?? "Failed to update league" });
          setSaving(false);
          return;
        }

        const updated = data;

        savedLeague = {
          ...editing,
          ...(updated?.league ?? updated ?? {}),
          name: form.name,
          description: form.description || null,
          isHidden: form.isHidden,
        };
      } else {
        const res = await fetch("/api/leagues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const message = data?.error ?? "Failed to create league";

          if (message.toLowerCase().includes("name")) {
            setFormErrors({ name: message });
          } else {
            setFormErrors({ general: message });
          }

          setSaving(false);
          return;
        }

        const created = await res.json();

        savedLeague = {
          ...(created?.league ?? created),
          name: created?.league?.name ?? created?.name ?? form.name,
          description:
            created?.league?.description ?? created?.description ?? (form.description || null),
          isHidden: created?.league?.isHidden ?? created?.isHidden ?? form.isHidden,
        };
      }

      if (!savedLeague?.id) {
        setFormErrors({ general: "League was saved, but no league payload was returned." });
        setSaving(false);
        return;
      }

      if (savedLeague.id && logoFile) {
        const uploaded = await uploadLogo(savedLeague.id, logoFile);
        savedLeague = {
          ...savedLeague,
          logoUrl: uploaded?.logoUrl ?? logoPreview ?? savedLeague.logoUrl ?? null,
        };
      }

      setSaving(false);
      onSaved(savedLeague, mode);
      onClose();
    } catch (err) {
      setFormErrors({
        general: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit League" : "New League"}>
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
              League Name <span className="text-red-500">*</span>
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
              placeholder="League name"
            />
            {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-gray-700 dark:bg-gray-900"
              placeholder="Short description..."
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              League Logo <span className="font-normal text-gray-400">(optional)</span>
            </label>

            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="League logo preview"
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

          <label className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Hidden from public
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hidden leagues are visible only in admin and won’t appear on public pages.
              </p>
            </div>

            <input
              type="checkbox"
              checked={form.isHidden}
              onChange={(e) => setForm({ ...form, isHidden: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-600"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save Changes" : "Create League"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}