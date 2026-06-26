"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match } from "@/types";

type PublicGroupStageProps = {
  matches: Match[];
  isGroupAndBracket: boolean;
  tournamentType: "round_robin" | "group_and_bracket" | string;
  hasGroupMatches: boolean;
};

export default function PublicGroupStage({ matches, isGroupAndBracket, hasGroupMatches, tournamentType }: PublicGroupStageProps) {
  const isRoundRobin = tournamentType === "round_robin";

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

  const sectionTitle = isRoundRobin ? "Standings & Matches" : "Group Stage";
  const sectionSubtitle = isRoundRobin ? "Full round robin standings and fixtures." : "Browse matches by group.";
  const activeLabel = isRoundRobin ? "League Table" : `Group ${activeGroup}`;

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
    }> = {};

    for (const match of activeMatches) {
        if (match.teamAId && !rows[match.teamAId]) {
        rows[match.teamAId] = {
            teamId: match.teamAId,
            teamName: match.teamA?.name ?? "TBD",
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0,
        };
        }

        if (match.teamBId && !rows[match.teamBId]) {
        rows[match.teamBId] = {
            teamId: match.teamBId,
            teamName: match.teamB?.name ?? "TBD",
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0,
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

    return Object.values(rows)
        .map((row) => ({
        ...row,
        gd: row.gf - row.ga,
        }))
        .sort((a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.teamName.localeCompare(b.teamName)
        );
    }, [activeMatches]);



  if (groupTabs.length === 0) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Group Stage</h2>
          <p className="mt-1 text-sm text-slate-400">
            No group stage matches available yet.
          </p>
        </div>
      </section>
    );
  }

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
                  isActive
                    ? "bg-slate-100 text-slate-600"
                    : "bg-white/10 text-slate-400",
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
          {
            activeMatches.filter(
              (m) =>
                m.status === "completed" &&
                m.scoreA != null &&
                m.scoreB != null
            ).length
          }/{activeMatches.length} played
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="px-3 py-3 text-left font-medium">#</th>
                <th className="px-3 py-3 text-left font-medium">Team</th>
                <th className="px-3 py-3 text-right font-medium">W</th>
                <th className="px-3 py-3 text-right font-medium">D</th>
                <th className="px-3 py-3 text-right font-medium">L</th>
                <th className="px-3 py-3 text-right font-medium">GD</th>
                <th className="px-3 py-3 text-right font-medium">PTS</th>
              </tr>
            </thead>
            <tbody>
              {groupStandings.map((row, index) => (
                <tr
                  key={row.teamId}
                  className="border-t border-white/10 text-slate-200"
                >
                  <td className="px-3 py-3 text-slate-400">{index + 1}</td>
                  <td className="px-3 py-3 font-medium">{row.teamName}</td>
                  <td className="px-3 py-3 text-right">{row.wins}</td>
                  <td className="px-3 py-3 text-right">{row.draws}</td>
                  <td className="px-3 py-3 text-right">{row.losses}</td>
                  <td className="px-3 py-3 text-right">
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-white">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {activeMatches.map((match) => {
          const completed =
            match.status === "completed" &&
            match.scoreA !== null &&
            match.scoreB !== null;

          const aWins = completed && (match.scoreA ?? 0) > (match.scoreB ?? 0);
          const bWins = completed && (match.scoreB ?? 0) > (match.scoreA ?? 0);

          return (
            <div
              key={match.id}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
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
                  {match.round ? `Round ${match.round}` : "Match"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={[
                    "flex-1 truncate text-sm font-medium",
                    aWins ? "text-emerald-400" : "text-white",
                  ].join(" ")}
                >
                  {match.teamA?.name ?? "TBD"}
                </span>

                <div className="shrink-0 text-sm font-semibold tabular-nums text-slate-300">
                  {completed ? `${match.scoreA} : ${match.scoreB}` : "vs"}
                </div>

                <span
                  className={[
                    "flex-1 truncate text-right text-sm font-medium",
                    bWins ? "text-emerald-400" : "text-white",
                  ].join(" ")}
                >
                  {match.teamB?.name ?? "TBD"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);
}