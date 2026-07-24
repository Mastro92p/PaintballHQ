"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  teamCount: number;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (bracketSize: number) => void;
};

const BRACKET_SIZES = [2, 4, 8, 16, 32];

export function GenerateBracketModal({
  open,
  teamCount,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const allowedSizes = useMemo(
    () => BRACKET_SIZES.filter((size) => size <= teamCount),
    [teamCount]
  );

  const [selectedSize, setSelectedSize] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedSize(allowedSizes.at(-1) ?? null);
  }, [open, allowedSizes]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#2a2f39] bg-[#11151b] shadow-2xl">
        <div className="border-b border-[#222833] px-5 py-4">
          <h3 className="text-base font-semibold text-slate-100">
            Create bracket
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Choose how many enrolled teams will be placed into the knockout bracket.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl border border-[#222833] bg-[#0d1015] px-3 py-2 text-sm text-slate-300">
            Enrolled teams: <span className="font-semibold text-slate-100">{teamCount}</span>
          </div>

          {allowedSizes.length === 0 ? (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-3 text-sm text-red-300">
              You need at least 2 enrolled teams to create a bracket.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Bracket size
              </p>

              <div className="grid grid-cols-2 gap-2">
                {allowedSizes.map((size) => {
                  const selected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-teal-500 bg-teal-500/10 text-slate-100"
                          : "border-[#2a2f39] bg-[#151922] text-slate-300 hover:bg-[#1a1f29]"
                      }`}
                    >
                      <div className="text-sm font-semibold">{size} teams</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {size === 2
                          ? "Final only"
                          : size === 4
                          ? "Semifinals"
                          : size === 8
                          ? "Quarterfinals"
                          : size === 16
                          ? "Round of 16"
                          : "Round of 32"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-[#222833] bg-[#0d1015] px-3 py-3 text-xs text-slate-400">
            Manual mode creates the bracket structure first. You can assign teams to the matches afterward.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#222833] px-5 py-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button
            onClick={() => selectedSize && onSubmit(selectedSize)}
            disabled={!selectedSize || allowedSizes.length === 0}
            loading={loading}
          >
            Create Bracket
          </Button>
        </div>
      </div>
    </div>
  );
}