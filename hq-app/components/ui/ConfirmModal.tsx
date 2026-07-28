"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  requireText?: string;
  requireTextLabel?: string;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  danger = false,
  onConfirm,
  onCancel,
  requireText,
  requireTextLabel,
}: ConfirmModalProps) {
  const [typedValue, setTypedValue] = useState("");

  useEffect(() => {
    if (!open) {
      setTypedValue("");
    }
  }, [open]);

  const needsTypedConfirmation = Boolean(requireText);
  const confirmDisabled =
    loading || (needsTypedConfirmation && typedValue !== requireText);

  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="px-5 py-4">
        <div className="space-y-4">
          {description ? (
            <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
              {description}
            </p>
          ) : null}

          {needsTypedConfirmation ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {requireTextLabel ?? (
                  <>
                    Type{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {requireText}
                    </span>{" "}
                    to confirm
                  </>
                )}
              </label>

              <input
                type="text"
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                placeholder={requireText}
                autoFocus
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                danger
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-teal-600 hover:bg-teal-500"
              }`}
            >
              {loading ? "Please wait..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}