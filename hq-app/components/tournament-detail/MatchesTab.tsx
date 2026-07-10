"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import type { Match, Team } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GroupMatchCard } from "@/components/tournament-detail/GroupMatchCard";
import { getClassicMatchResult } from "@/lib/utils";

type Props = {
  matches: Match[];
  enrolledTeams: Team[];
  isGroupAndBracket: boolean;
  hasGroupMatches: boolean;
  isClassic: boolean;
   canAddMatch: boolean;
  generatingGroups: boolean;
  groupsError: string | null;
  deletingMatch: number | null;
  onGenerateGroups: () => void;
  onOpenAddMatch: () => void;
  onEditMatch: (m: Match) => void;
  onDeleteMatch: (id: number) => void;
};

function computeStandings(teams: Team[], matches: Match[], isClassic: boolean) {
  const table: Record<number, { team: Team; w: number; d: number; l: number; gf: number; ga: number; pts: number; bodyCount: number }> = {};

  for (const t of teams) {
    table[t.id] = { team: t, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, bodyCount: 0 };
  }

  for (const m of matches) {
    if (m.status !== "completed" || m.scoreA == null || m.scoreB == null) continue;
    if (!m.teamAId || !m.teamBId) continue;

    const a = table[m.teamAId];
    const b = table[m.teamBId];
    if (!a || !b) continue;

    a.gf += m.scoreA;
    a.ga += m.scoreB;
    b.gf += m.scoreB;
    b.ga += m.scoreA;

    if (isClassic) {
      const result = getClassicMatchResult(m.scoreA, m.scoreB, m.bodyCountA ?? null, m.bodyCountB ?? null);
      if (result.winner === null) {
        // match not actually decided — skip, don't count as played
      } else {
        a.pts += result.pointsA;
        b.pts += result.pointsB;
        a.bodyCount += result.bodyCountA;
        b.bodyCount += result.bodyCountB;

        if (result.winner === "A") {
          a.w++; b.l++;
        } else if (result.winner === "B") {
          b.w++; a.l++;
        } else {
          a.d++; b.d++;
        }
      }
    }
  }

  return Object.values(table).sort((a, b) => {
    const gd = (x: typeof a) => x.gf - x.ga;
    return b.pts - a.pts || gd(b) - gd(a) || b.bodyCount - a.bodyCount || b.gf - a.gf;
  });
}

export function MatchesTab({
  matches,
  enrolledTeams,
  isGroupAndBracket,
  isClassic,
  hasGroupMatches,
  canAddMatch,
  generatingGroups,
  groupsError,
  deletingMatch,
  onGenerateGroups,
  onOpenAddMatch,
  onEditMatch,
  onDeleteMatch,
}: Props) {

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const groupMatches = matches.filter((m) => m.phase === "group");

  const matchesByGroup = groupMatches.reduce<Record<string, Match[]>>((acc, m) => {
    const g = m.group ?? "?";
    if (!acc[g]) acc[g] = [];
    acc[g].push(m);
    return acc;
  }, {});

  const matchesByRound = matches
    .filter((m) => m.phase === "group")
    .reduce<Record<number, Match[]>>((acc, m) => {
      const r = m.round ?? 0;
      if (!acc[r]) acc[r] = [];
      acc[r].push(m);
      return acc;
    }, {});

  const isEmpty =
    groupMatches.length === 0 && !isGroupAndBracket
      ? matches.length === 0
      : groupMatches.length === 0;

  const groupLabels = useMemo(
    () => Object.keys(matchesByGroup).sort((a, b) => a.localeCompare(b)),
    [matchesByGroup]
  );

  const urlGroup = searchParams.get("group") ?? "";
  const [activeGroup, setActiveGroup] = useState<string>(urlGroup);

  useEffect(() => {
    if (!groupLabels.length) return;

    if (urlGroup && groupLabels.includes(urlGroup)) {
      setActiveGroup(urlGroup);
      return;
    }

    if (!activeGroup || !groupLabels.includes(activeGroup)) {
      setActiveGroup(groupLabels[0]);
    }
  }, [urlGroup, groupLabels, activeGroup]);

  function selectGroup(groupLabel: string) {
    setActiveGroup(groupLabel);

    const params = new URLSearchParams(window.location.search);
    params.set("group", groupLabel);
    window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
  }

  const currentGroup =
    activeGroup && groupLabels.includes(activeGroup)
      ? activeGroup
      : groupLabels[0] || "";

  const currentMatches = currentGroup ? matchesByGroup[currentGroup] ?? [] : [];

  const currentTeamIds = new Set(
    currentMatches.flatMap((m) => [m.teamAId, m.teamBId]).filter(Boolean) as number[]
  );

  const currentGroupTeams = enrolledTeams.filter((t) => currentTeamIds.has(t.id));
  const currentStandings = computeStandings(currentGroupTeams, currentMatches, isClassic);

return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {isGroupAndBracket ? "Group Stage Matches" : "Matches"}
        </h2>

        <div className="flex items-center gap-2">
          {isGroupAndBracket && !hasGroupMatches ? (
            <Button
              size="sm"
              loading={generatingGroups}
              disabled={generatingGroups || enrolledTeams.length < 4}
              title={enrolledTeams.length < 4 ? "Enroll at least 4 teams first" : ""}
              onClick={onGenerateGroups}
            >
              ⚡ Generate Groups
            </Button>
          ) : canAddMatch ? (
            <Button
              size="sm"
              onClick={onOpenAddMatch}
              disabled={enrolledTeams.length < 2}
              title={enrolledTeams.length < 2 ? "Enroll at least 2 teams first" : ""}
            >
              + Add Match
            </Button>
          ) : null}
        </div>
      </div>

      {groupsError && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
          {groupsError}
        </div>
      )}

      {isEmpty ? (
        <div className="text-center py-10 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
          <p className="text-2xl mb-2">🎮</p>
          <p className="font-medium">No matches yet</p>
          <p className="text-sm mt-1">
            {isGroupAndBracket
              ? enrolledTeams.length < 4
                ? "Enroll at least 4 teams to generate groups"
                : 'Click "Generate Groups" to create the group stage'
              : enrolledTeams.length < 2
              ? "Enroll at least 2 teams to add matches"
              : 'Click "+ Add Match" to create the first match'}
          </p>
        </div>
      ) : isGroupAndBracket ? (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {groupLabels.map((groupLabel) => {
              const total = matchesByGroup[groupLabel]?.length ?? 0;
              const played = (matchesByGroup[groupLabel] ?? []).filter(
                (m) => m.status === "completed"
              ).length;

              return (
                <button
                  key={groupLabel}
                  onClick={() => selectGroup(groupLabel)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentGroup === groupLabel
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Group {groupLabel}
                  <span className="ml-2 text-xs opacity-80">
                    {played}/{total}
                  </span>
                </button>
              );
            })}
          </div>

          {currentGroup && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Group {currentGroup}
                </span>
                <span className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                <span className="text-xs text-gray-400 tabular-nums">
                  {currentMatches.filter((m) => m.status === "completed").length}/
                  {currentMatches.length} played
                </span>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-400 uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 text-left w-6">#</th>
                      <th className="px-3 py-2 text-left">Team</th>
                      <th className="px-3 py-2 text-center w-8">W</th>
                      <th className="px-3 py-2 text-center w-8">D</th>
                      <th className="px-3 py-2 text-center w-8">L</th>
                      <th className="px-3 py-2 text-center w-12">GD</th>
                      <th className="px-3 py-2 text-center w-10 font-bold text-gray-600 dark:text-gray-300">
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {currentStandings.map((row, idx) => {
                      const pts = row.w * 3 + row.d;
                      const gd = row.gf - row.ga;

                      return (
                        <tr
                          key={row.team.id}
                          className={`bg-white dark:bg-gray-900 ${
                            idx === 0 ? "border-l-2 border-l-teal-500" : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-gray-400 tabular-nums">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                            {row.team.name}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-gray-400">
                            {row.w}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-gray-400">
                            {row.d}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-gray-400">
                            {row.l}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums text-gray-500">
                            {gd > 0 ? `+${gd}` : gd}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums font-bold text-gray-900 dark:text-gray-100">
                            {pts}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {currentMatches
                  .sort((a, b) => a.id - b.id)
                  .map((m) => (
                    <GroupMatchCard
                      key={m.id}
                      match={m}
                      deleting={deletingMatch === m.id}
                      onEdit={onEditMatch}
                      onDelete={onDeleteMatch}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {isClassic && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-400 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left w-6">#</th>
                    <th className="px-3 py-2 text-left">Team</th>
                    <th className="px-3 py-2 text-center w-8">W</th>
                    <th className="px-3 py-2 text-center w-8">D</th>
                    <th className="px-3 py-2 text-center w-8">L</th>
                    <th className="px-3 py-2 text-center w-14">Bodies</th>
                    <th className="px-3 py-2 text-center w-10 font-bold text-gray-600 dark:text-gray-300">
                      Pts
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {computeStandings(enrolledTeams, matches, true).map((row, idx) => (
                    <tr
                      key={row.team.id}
                      className={`bg-white dark:bg-gray-900 ${
                        idx === 0 ? "border-l-2 border-l-teal-500" : ""
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-400 tabular-nums">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                        {row.team.name}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-gray-400">
                        {row.w}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-gray-400">
                        {row.d}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums text-gray-600 dark:text-gray-400">
                        {row.l}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums text-gray-500">
                        {row.bodyCount}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums font-bold text-gray-900 dark:text-gray-100">
                        {row.pts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {Object.entries(matchesByRound)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([round, rMatches]) => (
              <div key={round} className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-3">
                  <span>{Number(round) === 0 ? "Unassigned" : `Round ${round}`}</span>
                  <span className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {rMatches.map((m) => (
                    <GroupMatchCard
                      key={m.id}
                      match={m}
                      deleting={deletingMatch === m.id}
                      onEdit={onEditMatch}
                      onDelete={onDeleteMatch}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  );

}
