"use client";

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
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 text-gray-100 shadow-2xl"
      >
        <div className="p-6 space-y-3">
          <h3 id="confirm-modal-title" className="text-lg font-semibold">
            {title}
          </h3>

          {description ? (
            <p className="text-sm leading-6 text-gray-400">{description}</p>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-50"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                danger
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-teal-600 text-white hover:bg-teal-500"
              }`}
            >
              {loading ? "Please wait..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}