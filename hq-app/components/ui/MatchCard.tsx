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
  <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3">
{/* Left image panel */}
{match.teamA?.logoUrl && (
  <div
    className="pointer-events-none absolute inset-y-0 left-0 w-[43%] overflow-hidden bg-slate-700"
    style={{
      clipPath: "polygon(0 0, 90% 0, 100% 100%, 0 100%)",
    }}
  >
    <div
      className="absolute inset-0 bg-center bg-no-repeat opacity-72"
      style={{
        backgroundImage: `url(${match.teamA.logoUrl})`,
        backgroundSize: "100%",
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/5 via-slate-950/10 to-slate-950/38" />
  </div>
)}

{/* Right image panel */}
{match.teamB?.logoUrl && (
  <div
    className="pointer-events-none absolute inset-y-0 right-0 w-[43%] overflow-hidden bg-slate-700"
    style={{
      clipPath: "polygon(10% 0, 100% 0, 100% 100%, 0 100%)",
    }}
  >
    <div
      className="absolute inset-0 bg-center bg-no-repeat opacity-72"
      style={{
        backgroundImage: `url(${match.teamB.logoUrl})`,
        backgroundSize: "100%",
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-l from-slate-950/5 via-slate-950/10 to-slate-950/38" />
  </div>
)}

    {/* Soft center depth only */}
    <div className="pointer-events-none absolute inset-y-2 left-1/2 w-[22%] -translate-x-1/2 rounded-md bg-black/6 blur-sm" />

    {/* Global readability overlay */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/8 via-transparent to-slate-950/8" />

    {/* Foreground */}
    <div className="relative z-10">
      <div className="relative mb-2 h-4">
        <span className="absolute inset-x-0 top-0 text-center text-xs text-slate-400">
          {match.round && !isRoundRobin ? `Block ${match.round}` : ""}
        </span>
      </div>


      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center">
          <span
            className={[
              "inline-flex max-w-full items-center rounded-full border border-white/10 bg-slate-950/55 px-2.5 py-1 text-sm backdrop-blur-sm",
              aWins ? "font-bold text-emerald-300" : "font-medium text-white",
            ].join(" ")}
          >
            <span className="truncate">{match.teamA?.name ?? "TBD"}</span>
          </span>
        </div>

        {completed ? (
          <div className="relative z-10 flex shrink-0 items-center gap-1.5">
            {isClassic && match.bodyCountA != null && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full border border-white/10 bg-slate-800/100 px-1.5 text-[10px] font-semibold leading-none text-slate-100 tabular-nums">
                {match.bodyCountA}
              </span>
            )}

            <span
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white tabular-nums shadow-lg",
                aWins
                  ? "bg-emerald-500"
                  : draw
                  ? "bg-slate-700"
                  : "bg-red-500",
              ].join(" ")}
            >
              {match.scoreA}
            </span>

            <span className="text-xs text-slate-400">:</span>

            <span
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white tabular-nums shadow-lg",
                bWins
                  ? "bg-emerald-500"
                  : draw
                  ? "bg-slate-700"
                  : "bg-red-500",
              ].join(" ")}
            >
              {match.scoreB}
            </span>

            {isClassic && match.bodyCountB != null && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full border border-white/10 bg-slate-800/100 px-1.5 text-[10px] font-semibold leading-none text-slate-100 tabular-nums">
                {match.bodyCountB}
              </span>
            )}
          </div>
        ) : (
          <span className="shrink-0 px-2 text-xs font-medium text-slate-400">
            vs
          </span>
        )}

        <div className="flex min-w-0 flex-1 items-center justify-end">
          <span
            className={[
              "inline-flex max-w-full items-center rounded-full border border-white/10 bg-slate-950/55 px-2.5 py-1 text-sm backdrop-blur-sm",
              bWins ? "font-bold text-emerald-300" : "font-medium text-white",
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