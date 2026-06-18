"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: ModalSize;
  className?: string;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",   // 448px  — simple confirmations
  md: "max-w-lg",   // 512px  — forms (default)
  lg: "max-w-2xl",  // 672px  — complex forms, match modals
  xl: "max-w-4xl",  // 896px  — tables, history modals
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={cn(
          "relative z-10 bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full mx-4 p-6",
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}