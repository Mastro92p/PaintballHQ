"use client";

import { Team } from "@/types";
import { useEffect, useRef, useState } from "react";

export function TeamFilterDropdown({
  teams,
  value,
  onChange,
}: {
  teams: Team[];
  value: number | "all";
  onChange: (value: number | "all") => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    value === "all"
      ? "All teams"
      : teams.find((t) => t.id === value)?.name ?? "All teams";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-[160px] items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/10 focus:border-teal-400/50 focus:outline-none"
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="scrollbar-thin absolute right-0 z-50 mt-1 max-h-64 w-full min-w-[180px] overflow-y-auto rounded-lg border border-white/10 bg-slate-900 py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
            className={[
              "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
              value === "all"
                ? "bg-teal-500/15 text-teal-300"
                : "text-slate-200 hover:bg-white/5",
            ].join(" ")}
          >
            All teams
          </button>

          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => {
                onChange(team.id);
                setOpen(false);
              }}
              className={[
                "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
                value === team.id
                  ? "bg-teal-500/15 text-teal-300"
                  : "text-slate-200 hover:bg-white/5",
              ].join(" ")}
            >
              {team.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}