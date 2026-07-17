"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import type { FormatConfig, Match, Team } from "@/types";
import { Button } from "@/components/ui/Button";
import { GroupMatchCard } from "@/components/tournament-detail/GroupMatchCard";
import { getClassicMatchResult, calcStandings } from "@/lib/utils";
import {
  GroupStandingsTable,
  type StandingRow,
} from "@/components/tournament-detail/GroupStandingsTable";
import { GroupTeamPanel } from "@/components/tournament-detail/GroupTeamPanel";
import { ManualGroupManager } from "@/components/tournament-detail/ManualGroupManager";

type Props = {
  matches: Match[];
  enrolledTeams: Team[];
  isGroupAndBracket: boolean;
  hasGroupMatches: boolean;
  isClassic: boolean;
  canAddMatch: boolean;
  managementMode: "auto" | "manual";
  formatConfig: FormatConfig | null;
  teamGroups: Record<number, string[]>;
  assigningTeamId: number | null;
  generatingGroups: boolean;
  groupsError: string | null;
  deletingMatch: number | null;
  onGenerateGroups: () => void;
  onOpenAddMatch: (group?: string) => void;
  onAssignGroup: (teamId: number, group: string | null) => void;
  onEditMatch: (m: Match) => void;
  onDeleteMatch: (id: number) => void;
  resettingGroups: boolean;
  onResetGroups: () => void;
  savingGroups: boolean;
  onAddGroup: (name: string) => void;
  onRenameGroup: (oldName: string, newName: string) => void;
  onDeleteGroup: (name: string) => void;
};

function computeClassicStandings(teams: Team[], matches: Match[]): StandingRow[] {
  const table: Record<
    number,
    {
      team: Team;
      w: number;
      d: number;
      l: number;
      gf: number;
      ga: number;
      pts: number;
      bodyCount: number;
    }
  > = {};

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

    const result = getClassicMatchResult(
      m.scoreA,
      m.scoreB,
      m.bodyCountA ?? null,
      m.bodyCountB ?? null
    );
    if (result.winner === null) continue;

    a.pts += result.pointsA;
    b.pts += result.pointsB;
    a.bodyCount += result.bodyCountA;
    b.bodyCount += result.bodyCountB;

    if (result.winner === "A") {
      a.w++;
      b.l++;
    } else if (result.winner === "B") {
      b.w++;
      a.l++;
    } else {
      a.d++;
      b.d++;
    }
  }

  return Object.values(table)
    .map((r) => ({
      teamId: r.team.id,
      teamName: r.team.name,
      w: r.w,
      d: r.d,
      l: r.l,
      gf: r.gf,
      ga: r.ga,
      gd: r.gf - r.ga,
      pts: r.pts,
      bodyCount: r.bodyCount,
    }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.bodyCount - a.bodyCount || b.gf - a.gf);
}

function computeStandardStandings(teams: Team[], matches: Match[]): StandingRow[] {
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const enrolledIds = teams.map((t) => t.id);
  const standings = calcStandings(matches, teamMap, enrolledIds);

  return standings.map((s) => ({
    teamId: s.teamId,
    teamName: s.teamName,
    w: s.wins,
    d: s.draws,
    l: s.losses,
    gf: s.goalsFor,
    ga: s.goalsAgainst,
    gd: s.goalDiff,
    pts: s.points,
    bodyCount: 0,
  }));
}

function getStandings(teams: Team[], matches: Match[], isClassic: boolean): StandingRow[] {
  return isClassic ? computeClassicStandings(teams, matches) : computeStandardStandings(teams, matches);
}

function getRoundHeading(round: number, matches: Match[]) {
  const labels = Array.from(
    new Set(matches.map((m) => m.label?.trim()).filter((label): label is string => Boolean(label)))
  );

  const base = round === 0 ? "Unassigned" : `Round ${round}`;

  if (labels.length === 1) {
    return `${base} · ${labels[0]}`;
  }

  return base;
}

export function MatchesTab({
  matches,
  enrolledTeams,
  isGroupAndBracket,
  isClassic,
  canAddMatch,
  hasGroupMatches,
  managementMode,
  formatConfig,
  teamGroups,
  assigningTeamId,
  generatingGroups,
  resettingGroups,
  groupsError,
  deletingMatch,
  onGenerateGroups,
  onOpenAddMatch,
  onAssignGroup,
  onResetGroups,
  onEditMatch,
  onDeleteMatch,
  savingGroups,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
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

  const configGroupLabels = useMemo(() => {
    if (managementMode !== "manual") return [];
    return formatConfig?.groups ?? [];
  }, [managementMode, formatConfig]);

  const derivedGroupLabels = useMemo(
    () => Object.keys(matchesByGroup).sort((a, b) => a.localeCompare(b)),
    [matchesByGroup]
  );

  const groupLabels = useMemo(() => {
    if (managementMode === "manual") {
      return Array.from(new Set([...configGroupLabels, ...derivedGroupLabels])).sort();
    }
    return derivedGroupLabels;
  }, [managementMode, configGroupLabels, derivedGroupLabels]);

  const isEmpty = isGroupAndBracket
    ? managementMode === "manual"
      ? groupLabels.length === 0
      : groupMatches.length === 0
    : matches.length === 0;

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
    activeGroup && groupLabels.includes(activeGroup) ? activeGroup : groupLabels[0] || "";

  const currentMatches = currentGroup ? matchesByGroup[currentGroup] ?? [] : [];

  const currentTeamIds = new Set(
    currentMatches.flatMap((m) => [m.teamAId, m.teamBId]).filter(Boolean) as number[]
  );

  const currentGroupTeams =
    managementMode === "manual"
      ? enrolledTeams.filter((t) => (teamGroups[t.id] ?? []).includes(currentGroup))
      : enrolledTeams.filter((t) => currentTeamIds.has(t.id));

  const currentStandings = getStandings(currentGroupTeams, currentMatches, isClassic);
  const overallStandings = getStandings(enrolledTeams, matches, isClassic);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {isGroupAndBracket ? "Group Stage Matches" : "Matches"}
        </h2>

        <div className="flex items-center gap-2">
          {isGroupAndBracket &&
            (hasGroupMatches ||
              Object.values(teamGroups).some((groups) => (groups ?? []).length > 0)) && (
              <Button
                size="sm"
                variant="danger"
                loading={resettingGroups}
                onClick={onResetGroups}
              >
                ↺ Reset Groups
              </Button>
            )}

          {isGroupAndBracket && managementMode === "auto" && !hasGroupMatches ? (
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
              onClick={() => onOpenAddMatch(isGroupAndBracket ? currentGroup : undefined)}
              disabled={
                isGroupAndBracket ? currentGroupTeams.length < 2 : enrolledTeams.length < 2
              }
              title={
                isGroupAndBracket && currentGroupTeams.length < 2
                  ? "Assign at least 2 teams to this group first"
                  : enrolledTeams.length < 2
                  ? "Enroll at least 2 teams first"
                  : ""
              }
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
              ? managementMode === "manual"
                ? "Add a group to start building your group stage manually"
                : enrolledTeams.length < 4
                ? "Enroll at least 4 teams to generate groups"
                : 'Click "Generate Groups" to create the group stage'
              : enrolledTeams.length < 2
              ? "Enroll at least 2 teams to add matches"
              : 'Click "+ Add Match" to create the first match'}
          </p>
          {isGroupAndBracket && managementMode === "manual" && (
            <div className="mt-4 flex justify-center">
              <ManualGroupManager
                groups={groupLabels}
                savingGroups={savingGroups}
                onAddGroup={onAddGroup}
                onRenameGroup={onRenameGroup}
                onDeleteGroup={onDeleteGroup}
              />
            </div>
          )}
        </div>
      ) : isGroupAndBracket ? (
        <div className="space-y-6">
          {managementMode === "manual" && (
            <ManualGroupManager
              groups={groupLabels}
              savingGroups={savingGroups}
              onAddGroup={onAddGroup}
              onRenameGroup={onRenameGroup}
              onDeleteGroup={onDeleteGroup}
            />
          )}

          <div className="flex flex-wrap gap-2">
            {groupLabels.map((groupLabel) => {
              const total = matchesByGroup[groupLabel]?.length ?? 0;
              const played = (matchesByGroup[groupLabel] ?? []).filter(
                (m) => m.status === "completed"
              ).length;
              const teamCount = enrolledTeams.filter((t) =>
                (teamGroups[t.id] ?? []).includes(groupLabel)
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
                    {managementMode === "manual"
                      ? `${teamCount} team${teamCount === 1 ? "" : "s"}`
                      : `${played}/${total}`}
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

              {managementMode === "manual" && (
                <GroupTeamPanel
                  group={currentGroup}
                  capacity={formatConfig?.teamsPerGroup}
                  allTeams={enrolledTeams}
                  teamGroups={teamGroups}
                  assigningTeamId={assigningTeamId}
                  managementMode={managementMode}
                  onAssign={onAssignGroup}
                />
              )}

              <GroupStandingsTable rows={currentStandings} isClassic={isClassic} />

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
          <GroupStandingsTable rows={overallStandings} isClassic={isClassic} />

          {Object.entries(matchesByRound)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([round, rMatches]) => (
              <div key={round} className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-3">
                  <span>{getRoundHeading(Number(round), rMatches)}</span>
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