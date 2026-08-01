"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import type { FormatConfig, Match, Team, TournamentGroup } from "@/types";
import { Button } from "@/components/ui/Button";
import { GroupMatchCard } from "@/components/tournament-detail/GroupMatchCard";
import { getClassicMatchResult, calcStandings } from "@/lib/utils";
import {
  GroupStandingsTable,
  type StandingRow,
} from "@/components/tournament-detail/GroupStandingsTable";
import { GroupTeamPanel } from "@/components/tournament-detail/GroupTeamPanel";
import { ManualGroupManager } from "@/components/tournament-detail/ManualGroupManager";

import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";

type Props = {
  matches: Match[];
  enrolledTeams: Team[];
  isGroupAndBracket: boolean;
  hasGroupMatches: boolean;
  isClassic: boolean;
  canAddMatch: boolean;
  managementMode: "auto" | "manual";
  formatConfig: FormatConfig | null;
  groups: TournamentGroup[];
  activeGroupTab: number | null;
  setActiveGroupTab: (groupId: number | null) => void;
  teamGroups: Record<number, number[]>;
  groupNameById: Record<number, string>;
  assigningTeamId: number | null;
  generatingGroups: boolean;
  groupsError: string | null;
  deletingMatch: number | null;
  onGenerateGroups: () => void;
  onOpenAddMatch: (groupId?: number | null) => void;
  onAssignGroup: (teamId: number, groupId: number | null) => void;
  onEditMatch: (m: Match) => void;
  onDeleteMatch: (id: number) => void;
  resettingGroups: boolean;
  onResetGroups: () => void;
  savingGroups: boolean;
  onAddGroup: (name: string) => void;
  onRenameGroup: (groupId: number, newName: string) => void;
  onDeleteGroup: (groupId: number) => void;
  onReorderGroups: (groupIds: number[]) => void | Promise<void>;
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
    table[t.id] = {
      team: t,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      pts: 0,
      bodyCount: 0,
    };
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
    .sort(
      (a, b) => b.pts - a.pts || b.gd - a.gd || b.bodyCount - a.bodyCount || b.gf - a.gf
    );
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
  return isClassic
    ? computeClassicStandings(teams, matches)
    : computeStandardStandings(teams, matches);
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

type SortableGroupTabButtonProps = {
  group: TournamentGroup;
  index: number;
  selected: boolean;
  subtitle: string;
  onSelect: (groupId: number) => void;
};

function SortableGroupTabButton({
  group,
  index,
  selected,
  subtitle,
  onSelect,
}: SortableGroupTabButtonProps) {
  const { ref, isDragging } = useSortable({
    id: String(group.id),
    index,
    type: "group-tab",
    accept: "group-tab",
  });

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(group.id)}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-none ${
        selected
          ? "bg-teal-600 text-white"
          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      } ${isDragging ? "opacity-60" : ""}`}
    >
      {group.name}
      <span className="ml-2 text-xs opacity-80">{subtitle}</span>
    </button>
  );
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
  groups,
  activeGroupTab,
  setActiveGroupTab,
  teamGroups,
  groupNameById,
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
  onReorderGroups,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const groupMatches = matches.filter((m) => m.phase === "group");
  const [sortableGroups, setSortableGroups] = useState(groups);
  const [isDraggingGroups, setIsDraggingGroups] = useState(false);

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [isRenamingGroup, setIsRenamingGroup] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState("");

  const matchesByGroup = groupMatches.reduce<Record<number, Match[]>>((acc, m) => {
    if (m.groupId == null) return acc;
    if (!acc[m.groupId]) acc[m.groupId] = [];
    acc[m.groupId].push(m);
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

  const groupIds = useMemo(() => {
    if (managementMode === "manual") {
      return sortableGroups.map((g) => g.id);
    }

    return groups
      .filter((g) => (matchesByGroup[g.id] ?? []).length > 0)
      .map((g) => g.id);
  }, [managementMode, sortableGroups, groups, matchesByGroup]);

  const isEmpty = isGroupAndBracket
    ? managementMode === "manual"
      ? groupIds.length === 0
      : groupMatches.length === 0
    : matches.length === 0;

  const urlGroupParam = searchParams.get("groupId");
  const urlGroupId = urlGroupParam ? Number(urlGroupParam) : null;

  const [activeGroup, setActiveGroup] = useState<number | null>(urlGroupId);

  useEffect(() => {
    if (!isDraggingGroups) {
      setSortableGroups(groups);
    }
  }, [groups, isDraggingGroups]);

  useEffect(() => {
    if (!groupIds.length) return;

    if (
      urlGroupId != null &&
      !Number.isNaN(urlGroupId) &&
      groupIds.includes(urlGroupId)
    ) {
      setActiveGroup(urlGroupId);
      if (setActiveGroupTab) setActiveGroupTab(urlGroupId);
      return;
    }

    const preferred = activeGroupTab != null && groupIds.includes(activeGroupTab)
      ? activeGroupTab
      : activeGroup != null && groupIds.includes(activeGroup)
      ? activeGroup
      : groupIds[0];

    setActiveGroup(preferred);
    if (setActiveGroupTab) setActiveGroupTab(preferred);
  }, [urlGroupId, groupIds, activeGroup, activeGroupTab, setActiveGroupTab]);

  useEffect(() => {
    setIsRenamingGroup(false);
    setGroupNameDraft(activeGroup != null ? groupNameById[activeGroup] ?? "" : "");
  }, [activeGroup, groupNameById]);

  function selectGroup(groupId: number) {
    setActiveGroup(groupId);
    setActiveGroupTab(groupId);
    const params = new URLSearchParams(window.location.search);
    params.set("groupId", String(groupId));
    window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
  }

  const currentGroup =
    activeGroup != null && groupIds.includes(activeGroup) ? activeGroup : groupIds[0] ?? null;

  const currentMatches = currentGroup != null ? matchesByGroup[currentGroup] ?? [] : [];

  const currentTeamIds = new Set(
    currentMatches.flatMap((m) => [m.teamAId, m.teamBId]).filter(Boolean) as number[]
  );

  const currentGroupTeams =
    managementMode === "manual"
      ? currentGroup == null
        ? []
        : enrolledTeams.filter((t) => (teamGroups[t.id] ?? []).includes(currentGroup))
      : enrolledTeams.filter((t) => currentTeamIds.has(t.id));

  const currentStandings = getStandings(currentGroupTeams, currentMatches, isClassic);
  const overallStandings = getStandings(enrolledTeams, matches, isClassic);

  const visibleGroups =
    managementMode === "manual"
      ? sortableGroups.filter((group) => groupIds.includes(group.id))
      : groups.filter((group) => groupIds.includes(group.id));

  const handleGroupsDragStart = useCallback(() => {
    setIsDraggingGroups(true);
  }, []);

  const handleGroupsDragEnd = useCallback(
    async (event: any) => {
      setIsDraggingGroups(false);

      const nextGroups = move(sortableGroups, event);

      if (
        nextGroups.length === sortableGroups.length &&
        nextGroups.every((group, index) => group.id === sortableGroups[index]?.id)
      ) {
        return;
      }

      setSortableGroups(nextGroups);

      try {
        await onReorderGroups(nextGroups.map((group) => group.id));
      } catch (error) {
        console.error(error);
        setSortableGroups(groups);
      }
    },
    [sortableGroups, groups, onReorderGroups]
  );

  function handleConfirmAddGroup() {
    const name = newGroupName.trim();
    if (name) {
      onAddGroup(name);
    }
    setNewGroupName("");
    setIsAddingGroup(false);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {isGroupAndBracket ? "Group Stage Matches" : "Matches"}
        </h2>

        <div className="flex items-center gap-2">
          {isGroupAndBracket &&
            (hasGroupMatches ||
              Object.values(teamGroups).some((groupIds) => (groupIds ?? []).length > 0)) && (
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
                groups={groups}
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
          <DragDropProvider
            onDragStart={managementMode === "manual" ? handleGroupsDragStart : undefined}
            onDragEnd={managementMode === "manual" ? handleGroupsDragEnd : undefined}
          >
            <div className="flex flex-wrap items-center gap-2">
              {visibleGroups.map((group, index) => {
                const total = matchesByGroup[group.id]?.length ?? 0;
                const played = (matchesByGroup[group.id] ?? []).filter(
                  (m) => m.status === "completed"
                ).length;
                const teamCount = enrolledTeams.filter((t) =>
                  (teamGroups[t.id] ?? []).includes(group.id)
                ).length;

                const subtitle =
                  managementMode === "manual"
                    ? `${teamCount} team${teamCount === 1 ? "" : "s"}`
                    : `${played}/${total}`;

                return managementMode === "manual" ? (
                  <SortableGroupTabButton
                    key={group.id}
                    group={group}
                    index={index}
                    selected={currentGroup === group.id}
                    subtitle={subtitle}
                    onSelect={selectGroup}
                  />
                ) : (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => selectGroup(group.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentGroup === group.id
                        ? "bg-teal-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {group.name}
                    <span className="ml-2 text-xs opacity-80">{subtitle}</span>
                  </button>
                );
              })}

              {managementMode === "manual" && (
                isAddingGroup ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleConfirmAddGroup();
                        if (e.key === "Escape") {
                          setNewGroupName("");
                          setIsAddingGroup(false);
                        }
                      }}
                      placeholder="Group name"
                      className="w-40 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={savingGroups}
                      onClick={handleConfirmAddGroup}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setNewGroupName("");
                        setIsAddingGroup(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsAddingGroup(true)}
                  >
                    + Add
                  </Button>
                )
              )}
            </div>
          </DragDropProvider>

          {currentGroup != null && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {isRenamingGroup ? (
                  <>
                    <input
                      autoFocus
                      value={groupNameDraft}
                      onChange={(e) => setGroupNameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const nextName = groupNameDraft.trim();
                          if (nextName) onRenameGroup(currentGroup, nextName);
                          setIsRenamingGroup(false);
                        }
                        if (e.key === "Escape") {
                          setGroupNameDraft(groupNameById[currentGroup] ?? "");
                          setIsRenamingGroup(false);
                        }
                      }}
                      className="w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      placeholder="Group name"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={savingGroups}
                      onClick={() => {
                        const nextName = groupNameDraft.trim();
                        if (nextName) onRenameGroup(currentGroup, nextName);
                        setIsRenamingGroup(false);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setGroupNameDraft(groupNameById[currentGroup] ?? "");
                        setIsRenamingGroup(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {groupNameById[currentGroup] ?? `Group ${currentGroup}`}
                    </span>
                    <span className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                    <span className="text-xs text-gray-400 tabular-nums">
                      {currentMatches.filter((m) => m.status === "completed").length}/
                      {currentMatches.length} played
                    </span>

                    {managementMode === "manual" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsRenamingGroup(true)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          disabled={savingGroups}
                          onClick={() => onDeleteGroup(currentGroup)}
                          className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              {managementMode === "manual" && (
                <GroupTeamPanel
                  groupId={currentGroup}
                  groupName={groupNameById[currentGroup] ?? `Group ${currentGroup}`}
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