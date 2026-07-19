"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { League, LeagueFormErrors, LeagueFormState } from "@/types";

type LeagueFormModalProps = {
  open: boolean;
  editing: League | null;
  form: LeagueFormState;
  errors: LeagueFormErrors;
  saving: boolean;
  inputCls: (field: keyof LeagueFormState) => string;
  onClose: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
  onChange: (patch: Partial<LeagueFormState>) => void;
  onClearError: (field: keyof LeagueFormState) => void;
};

export function LeagueFormModal({
  open,
  editing,
  form,
  errors,
  saving,
  inputCls,
  onClose,
  onSubmit,
  onChange,
  onClearError,
}: LeagueFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit League" : "New League"}
    >
      <div className="px-5 py-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => {
                onChange({ name: e.target.value });
                if (errors.name) onClearError("name");
              }}
              className={inputCls("name")}
              placeholder="League name"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className={inputCls("description")}
              placeholder="Short description..."
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Logo URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              value={form.logoUrl}
              onChange={(e) => onChange({ logoUrl: e.target.value })}
              className={inputCls("logoUrl")}
              placeholder="https://..."
            />
          </div>

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