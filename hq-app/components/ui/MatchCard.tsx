"use client";

import type { Match } from "@/types";
import { getClassicMatchResult } from "@/lib/utils";

type MatchCardProps = {
  match: Match;
  isClassic?: boolean;
  isRoundRobin?: boolean;
};

export function MatchCard({
  match,
  isClassic = false,
  isRoundRobin = false,
}: MatchCardProps) {
  const completed =
    match.status === "completed" &&
    match.scoreA !== null &&
    match.scoreB !== null;

  let aWins = false;
  let bWins = false;
  let draw = false;

  if (completed) {
    if (isClassic) {
      const result = getClassicMatchResult(
        match.scoreA ?? null,
        match.scoreB ?? null,
        match.bodyCountA ?? null,
        match.bodyCountB ?? null
      );
      aWins = result.winner === "A";
      bWins = result.winner === "B";
      draw = result.winner === "draw";
    } else {
      draw = match.scoreA === match.scoreB;
      aWins = !draw && (match.scoreA ?? 0) > (match.scoreB ?? 0);
      bWins = !draw && (match.scoreB ?? 0) > (match.scoreA ?? 0);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 px-2.5 py-2 dark:border-white/10 dark:bg-[#0f172a] sm:px-4 sm:py-3">
      {/* Left image panel */}
      {match.teamA?.logoUrl && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[37%] overflow-hidden bg-gray-200 dark:bg-slate-700 sm:w-[43%]"
          style={{
            clipPath: "polygon(0 0, 90% 0, 100% 100%, 0 100%)",
          }}
        >
          <div
            className="absolute inset-0 bg-center bg-no-repeat opacity-90 dark:opacity-72"
            style={{
              backgroundImage: `url(${match.teamA.logoUrl})`,
              backgroundSize: "100%",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/25 dark:from-slate-950/5 dark:via-slate-950/10 dark:to-slate-950/38" />
        </div>
      )}

      {/* Right image panel */}
      {match.teamB?.logoUrl && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[37%] overflow-hidden bg-gray-200 dark:bg-slate-700 sm:w-[43%]"
          style={{
            clipPath: "polygon(10% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        >
          <div
            className="absolute inset-0 bg-center bg-no-repeat opacity-90 dark:opacity-72"
            style={{
              backgroundImage: `url(${match.teamB.logoUrl})`,
              backgroundSize: "100%",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-white/0 via-white/5 to-white/25 dark:from-slate-950/5 dark:via-slate-950/10 dark:to-slate-950/38" />
        </div>
      )}

      {/* Soft center depth only */}
      <div className="pointer-events-none absolute inset-y-2 left-1/2 w-[16%] -translate-x-1/2 rounded-md bg-black/4 blur-sm dark:bg-black/6 sm:w-[22%]" />

      {/* Global readability overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-white/15 dark:from-slate-950/8 dark:to-slate-950/8" />

      {/* Foreground */}
      <div className="relative z-10">
        <div className="relative mb-1 h-4 sm:mb-2">
          <span className="absolute inset-x-0 top-0 text-center text-[10px] text-gray-500 dark:text-slate-400 sm:text-xs">
            {match.round && !isRoundRobin ? `Block ${match.round}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center">
            <span
              className={[
                "inline-flex max-w-full min-w-0 items-center rounded-full border border-gray-200 dark:border-white/10 bg-white/75 dark:bg-slate-950/60 px-1.5 py-0.5 text-[10px] leading-none backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-sm",
                aWins
                  ? "font-bold text-emerald-600 dark:text-emerald-300"
                  : "font-medium text-gray-900 dark:text-white",
              ].join(" ")}
            >
              <span className="truncate">{match.teamA?.name ?? "TBD"}</span>
            </span>
          </div>

          {completed ? (
            <div className="relative z-10 flex shrink-0 items-center gap-0.5 sm:gap-1.5">
              {isClassic && match.bodyCountA != null && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-gray-200 dark:bg-slate-800/100 px-1 text-[8px] font-semibold leading-none text-gray-700 dark:text-slate-100 tabular-nums sm:h-6 sm:min-w-6 sm:px-1.5 sm:text-[10px]">
                  {match.bodyCountA}
                </span>
              )}

              <span
                className={[
                  "flex h-6.5 w-6.5 items-center justify-center rounded-full text-[10px] font-bold text-white tabular-nums shadow-lg sm:h-9 sm:w-9 sm:text-sm",
                  aWins
                    ? "bg-emerald-500"
                    : draw
                    ? "bg-gray-400 dark:bg-slate-700"
                    : "bg-red-500",
                ].join(" ")}
              >
                {match.scoreA}
              </span>

              <span className="text-[9px] text-gray-400 dark:text-slate-400 sm:text-xs">
                :
              </span>

              <span
                className={[
                  "flex h-6.5 w-6.5 items-center justify-center rounded-full text-[10px] font-bold text-white tabular-nums shadow-lg sm:h-9 sm:w-9 sm:text-sm",
                  bWins
                    ? "bg-emerald-500"
                    : draw
                    ? "bg-gray-400 dark:bg-slate-700"
                    : "bg-red-500",
                ].join(" ")}
              >
                {match.scoreB}
              </span>

              {isClassic && match.bodyCountB != null && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-gray-200 dark:bg-slate-800/100 px-1 text-[8px] font-semibold leading-none text-gray-700 dark:text-slate-100 tabular-nums sm:h-6 sm:min-w-6 sm:px-1.5 sm:text-[10px]">
                  {match.bodyCountB}
                </span>
              )}
            </div>
          ) : (
            <span className="shrink-0 px-1 text-[10px] font-medium text-gray-500 dark:text-slate-400 sm:px-2 sm:text-xs">
              vs
            </span>
          )}

          <div className="flex min-w-0 flex-1 items-center justify-end">
            <span
              className={[
                "inline-flex max-w-full min-w-0 items-center rounded-full border border-gray-200 dark:border-white/10 bg-white/75 dark:bg-slate-950/60 px-1.5 py-0.5 text-[10px] leading-none backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-sm",
                bWins
                  ? "font-bold text-emerald-600 dark:text-emerald-300"
                  : "font-medium text-gray-900 dark:text-white",
              ].join(" ")}
            >
              <span className="truncate">{match.teamB?.name ?? "TBD"}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}