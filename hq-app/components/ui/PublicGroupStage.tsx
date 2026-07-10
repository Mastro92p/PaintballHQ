"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match } from "@/types";
import { getClassicMatchResult } from "@/lib/utils";

type PublicGroupStageProps = {
  matches: Match[];
  isGroupAndBracket: boolean;
  tournamentType: "round_robin" | "round_robin_classic" | "group_and_bracket" | string;
  hasGroupMatches: boolean;
  isRoundRobin?: boolean;
};

const ROUND_ROBIN_TYPES = ["round_robin", "round_robin_classic"];

export default function PublicGroupStage({
  matches,
  isGroupAndBracket,
  hasGroupMatches,
  tournamentType,
  isRoundRobin: isRoundRobinProp,
}: PublicGroupStageProps) {
  const isRoundRobin = isRoundRobinProp ?? ROUND_ROBIN_TYPES.includes(tournamentType);
  const isClassic = tournamentType === "round_robin_classic";

  const groupMatchesByGroup = useMemo(() => {
    const groupPhaseMatches = matches.filter((m) => m.phase === "group");

    if (isRoundRobin) {
      return { All: groupPhaseMatches };
    }

    return groupPhaseMatches.reduce<Record<string, Match[]>>((acc, m) => {
      const group = m.group?.trim() || "Ungrouped";
      if (!acc[group]) acc[group] = [];
      acc[group].push(m);
      return acc;
    }, {});
  }, [matches, isRoundRobin]);

  const groupTabs = useMemo(
    () => Object.keys(groupMatchesByGroup).sort((a, b) => a.localeCompare(b)),
    [groupMatchesByGroup]
  );

  const [activeGroup, setActiveGroup] = useState("");

  useEffect(() => {
    if (!groupTabs.length) return;
    if (!activeGroup || !groupTabs.includes(activeGroup)) {
      setActiveGroup(groupTabs[0]);
    }
  }, [groupTabs, activeGroup]);

  const activeMatches = useMemo(() => {
    const current = activeGroup ? groupMatchesByGroup[activeGroup] ?? [] : [];
    return [...current].sort(
      (a, b) => (a.round ?? 0) - (b.round ?? 0) || a.id - b.id
    );
  }, [activeGroup, groupMatchesByGroup]);

  // Group matches by round — only meaningful for round robin (plain & classic).
  // Group-and-bracket keeps its flat grid, unaffected by this.
  const matchesByRound = useMemo(() => {
    if (!isRoundRobin) return {};
    return activeMatches.reduce<Record<number, Match[]>>((acc, m) => {
      const r = m.round ?? 0;
      if (!acc[r]) acc[r] = [];
      acc[r].push(m);
      return acc;
    }, {});
  }, [activeMatches, isRoundRobin]);

  const roundKeys = useMemo(
    () => Object.keys(matchesByRound).map(Number).sort((a, b) => a - b),
    [matchesByRound]
  );

  const groupStandings = useMemo(() => {
    const rows: Record<number, {
      teamId: number;
      teamName: string;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      gf: number;
      ga: number;
      gd: number;
      points: number;
      bodyCount: number;
    }> = {};

    for (const match of activeMatches) {
      if (match.teamAId && !rows[match.teamAId]) {
        rows[match.teamAId] = {
          teamId: match.teamAId,
          teamName: match.teamA?.name ?? "TBD",
          played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0, bodyCount: 0,
        };
      }
      if (match.teamBId && !rows[match.teamBId]) {
        rows[match.teamBId] = {
          teamId: match.teamBId,
          teamName: match.teamB?.name ?? "TBD",
          played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0, bodyCount: 0,
        };
      }

      const completed =
        match.status === "completed" &&
        match.teamAId != null &&
        match.teamBId != null &&
        match.scoreA != null &&
        match.scoreB != null;

      if (!completed) continue;

      const a = rows[match.teamAId!];
      const b = rows[match.teamBId!];

      a.played += 1;
      b.played += 1;
      a.gf += match.scoreA!;
      a.ga += match.scoreB!;
      b.gf += match.scoreB!;
      b.ga += match.scoreA!;

      if (isClassic) {
        const result = getClassicMatchResult(
          match.scoreA ?? null,
          match.scoreB ?? null,
          match.bodyCountA ?? null,
          match.bodyCountB ?? null
        );

        a.points += result.pointsA;
        b.points += result.pointsB;
        a.bodyCount += result.bodyCountA;
        b.bodyCount += result.bodyCountB;

        if (result.winner === "A") {
          a.wins += 1;
          b.losses += 1;
        } else if (result.winner === "B") {
          b.wins += 1;
          a.losses += 1;
        } else {
          a.draws += 1;
          b.draws += 1;
        }
      } else {
        if (match.scoreA! > match.scoreB!) {
          a.wins += 1;
          a.points += 3;
          b.losses += 1;
        } else if (match.scoreB! > match.scoreA!) {
          b.wins += 1;
          b.points += 3;
          a.losses += 1;
        } else {
          a.draws += 1;
          b.draws += 1;
          a.points += 1;
          b.points += 1;
        }
      }
    }

    return Object.values(rows)
      .map((row) => ({ ...row, gd: row.gf - row.ga }))
      .sort((a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.teamName.localeCompare(b.teamName)
      );
  }, [activeMatches, isClassic]);

  if (groupTabs.length === 0) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {isRoundRobin ? "Standings & Matches" : "Group Stage"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            No {isRoundRobin ? "matches" : "group stage matches"} available yet.
          </p>
        </div>
      </section>
    );
  }

  // Shared match card renderer — used both in the round-grouped layout
  // and the flat group-and-bracket grid, so styling stays identical.
  const renderMatchCard = (match: Match) => {
    const completed =
      match.status === "completed" && match.scoreA !== null && match.scoreB !== null;

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
      <div key={match.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span
            className={[
              "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
              completed
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300",
            ].join(" ")}
          >
            {match.status}
          </span>
          <span className="text-xs text-slate-400">
            {match.round && !isRoundRobin ? `Block ${match.round}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={[
              "flex-1 truncate text-sm font-medium",
              aWins ? "text-emerald-400 font-bold" : "text-white",
            ].join(" ")}
          >
            {match.teamA?.name ?? "TBD"}
          </span>

          {completed ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {isClassic && match.bodyCountA != null && (
                <span className="text-[11px] leading-none text-slate-400 tabular-nums">
                  ({match.bodyCountA})
                </span>
              )}
              <span
                className={[
                  "w-9 h-9 flex items-center justify-center rounded-full text-white text-sm font-bold tabular-nums",
                  aWins ? "bg-emerald-500" : draw ? "bg-slate-500" : "bg-red-500",
                ].join(" ")}
              >
                {match.scoreA}
              </span>

              <span className="text-slate-500 text-xs">:</span>

              <span
                className={[
                  "w-9 h-9 flex items-center justify-center rounded-full text-white text-sm font-bold tabular-nums",
                  bWins ? "bg-emerald-500" : draw ? "bg-slate-500" : "bg-red-500",
                ].join(" ")}
              >
                {match.scoreB}
              </span>
              {isClassic && match.bodyCountB != null && (
                <span className="text-[11px] leading-none text-slate-400 tabular-nums">
                  ({match.bodyCountB})
                </span>
              )}
            </div>
          ) : (
            <span className="shrink-0 text-xs font-medium text-slate-500 px-2">vs</span>
          )}

          <span
            className={[
              "flex-1 truncate text-right text-sm font-medium",
              bWins ? "text-emerald-400 font-bold" : "text-white",
            ].join(" ")}
          >
            {match.teamB?.name ?? "TBD"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">
          {isRoundRobin ? "Standings & Matches" : "Group Stage"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {isRoundRobin
            ? "Full round robin standings and fixtures."
            : "Browse matches by group."}
        </p>
      </div>

      {!isRoundRobin && (
        <div className="flex flex-wrap gap-1 rounded-xl bg-white/5 p-1 w-fit">
          {groupTabs.map((group) => {
            const isActive = activeGroup === group;
            const count = groupMatchesByGroup[group]?.length ?? 0;

            return (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={[
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/5",
                ].join(" ")}
              >
                <span>{`Group ${group}`}</span>
                <span
                  className={[
                    "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                    isActive ? "bg-slate-100 text-slate-600" : "bg-white/10 text-slate-400",
                  ].join(" ")}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
            {isRoundRobin ? "League Table" : `Group ${activeGroup}`}
          </h3>
          <span className="text-xs text-slate-400">
            {activeMatches.filter(
              (m) => m.status === "completed" && m.scoreA != null && m.scoreB != null
            ).length}
            /{activeMatches.length} played
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-3 py-3 text-left font-medium">#</th>
                  <th className="px-3 py-3 text-left font-medium">Team</th>
                  <th className="px-3 py-3 text-right font-medium">P</th>
                  <th className="px-3 py-3 text-right font-medium text-emerald-400/80">W</th>
                  <th className="px-3 py-3 text-right font-medium">D</th>
                  <th className="px-3 py-3 text-right font-medium text-red-400/80">L</th>
                  <th className="px-3 py-3 text-right font-medium">GD</th>
                  {isClassic && (
                    <th className="px-3 py-3 text-right font-medium text-sky-400/80">BC</th>
                  )}
                  <th className="px-3 py-3 text-right font-medium text-amber-400/80">PTS</th>
                </tr>
              </thead>
              <tbody>
                {groupStandings.map((row, index) => (
                  <tr key={row.teamId} className="border-t border-white/10 text-slate-200">
                    <td className="px-3 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-3 py-3 font-medium">{row.teamName}</td>
                    <td className="px-3 py-3 text-right text-slate-300">{row.played}</td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-400">{row.wins}</td>
                    <td className="px-3 py-3 text-right text-slate-300">{row.draws}</td>
                    <td className="px-3 py-3 text-right font-semibold text-red-400">{row.losses}</td>
                    <td className="px-3 py-3 text-right">
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </td>
                    {isClassic && (
                      <td className="px-3 py-3 text-right text-sky-400 tabular-nums">
                        {row.bodyCount}
                      </td>
                    )}
                    <td className="px-3 py-3 text-right font-semibold text-amber-400">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isRoundRobin ? (
          <div className="mt-4 space-y-6">
            {roundKeys.map((round) => (
              <div key={round} className="space-y-3">
                <h4 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  <span>{round === 0 ? "Unassigned" : `Block ${round}`}</span>
                  <span className="h-px flex-1 bg-white/10" />
                </h4>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {matchesByRound[round].map((match) => renderMatchCard(match))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {activeMatches.map((match) => renderMatchCard(match))}
          </div>
        )}
      </div>
    </section>
  );
}