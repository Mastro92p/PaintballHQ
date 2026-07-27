"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match, Team } from "@/types";
import { getClassicMatchResult } from "@/lib/utils";
import { GroupTabs } from "@/components/ui/GroupTabs";
import { StandingsTable, type StandingRow } from "@/components/ui/StandingsTable";
import { FixturesSection } from "@/components/ui/FixturesSection";

type GroupLike = {
  id: number;
  name: string;
  order?: number | null;
};

type TournamentTeamLike = {
  teamId: number;
  team?: Team | null;
  groupLinks?: Array<{
    groupId: number;
  }> | null;
};

type PublicGroupStageProps = {
  matches: Match[];
  groups: GroupLike[];
  teams: TournamentTeamLike[];
  isGroupAndBracket: boolean;
  tournamentType:
    | "round_robin"
    | "round_robin_classic"
    | "group_and_bracket"
    | string;
  hasGroupMatches: boolean;
  isRoundRobin?: boolean;
};

const ROUND_ROBIN_TYPES = ["round_robin", "round_robin_classic"];

function getPublicRoundHeading(round: number, matches: Match[]) {
  const labels = Array.from(
    new Set(
      matches
        .map((m) => m.label?.trim())
        .filter((label): label is string => Boolean(label))
    )
  );

  const base = round === 0 ? "Unassigned" : `Block ${round}`;

  if (labels.length === 1) {
    return `${base} · ${labels[0]}`;
  }

  return base;
}

export default function PublicGroupStage({
  matches,
  groups,
  teams,
  isGroupAndBracket,
  hasGroupMatches,
  tournamentType,
  isRoundRobin: isRoundRobinProp,
}: PublicGroupStageProps) {
  const isRoundRobin =
    isRoundRobinProp ?? ROUND_ROBIN_TYPES.includes(tournamentType);
  const isClassic = tournamentType === "round_robin_classic";

  const groupDefinitions = useMemo(() => {
    if (isRoundRobin) {
      return [{ id: 0, name: "All", order: 0 }];
    }

    return [...groups].sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
          (b.order ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name)
    );
  }, [groups, isRoundRobin]);

  const teamsByGroup = useMemo(() => {
    if (isRoundRobin) {
      return {
        All: teams
          .map((entry) => entry.team)
          .filter((team): team is Team => Boolean(team))
          .sort((a, b) => a.name.localeCompare(b.name)),
      };
    }

    const acc: Record<string, Team[]> = {};

    for (const group of groupDefinitions) {
      acc[group.name] = [];
    }

    for (const entry of teams) {
      if (!entry.team) continue;

      const linkIds = (entry.groupLinks ?? [])
        .map((link) => link.groupId)
        .filter((id): id is number => typeof id === "number");

      for (const groupId of linkIds) {
        const group = groupDefinitions.find((g) => g.id === groupId);
        if (!group) continue;
        acc[group.name] ??= [];
        acc[group.name].push(entry.team);
      }
    }

    for (const key of Object.keys(acc)) {
      acc[key] = acc[key].sort((a, b) => a.name.localeCompare(b.name));
    }

    return acc;
  }, [teams, groupDefinitions, isRoundRobin]);

  const groupMatchesByGroup = useMemo(() => {
    const groupPhaseMatches = matches.filter((m) => m.phase === "group");

    if (isRoundRobin) {
      return {
        All: {
          order: 0,
          matches: groupPhaseMatches,
        },
      };
    }

    const seeded = groupDefinitions.reduce<
      Record<string, { order: number; matches: Match[] }>
    >((acc, group) => {
      acc[group.name] = {
        order: group.order ?? Number.MAX_SAFE_INTEGER,
        matches: [],
      };
      return acc;
    }, {});

    for (const match of groupPhaseMatches) {
      const groupName = match.group?.name?.trim() || "Ungrouped";
      const groupOrder = match.group?.order ?? Number.MAX_SAFE_INTEGER;

      if (!seeded[groupName]) {
        seeded[groupName] = {
          order: groupOrder,
          matches: [],
        };
      }

      seeded[groupName].matches.push(match);
    }

    return seeded;
  }, [matches, groupDefinitions, isRoundRobin]);

  const groupTabs = useMemo(
    () =>
      Object.entries(groupMatchesByGroup)
        .sort(([, a], [, b]) => a.order - b.order)
        .map(([groupName]) => groupName),
    [groupMatchesByGroup]
  );

  const [activeGroup, setActiveGroup] = useState("");
  const [teamFilter, setTeamFilter] = useState<number | "all">("all");

  useEffect(() => {
    if (!groupTabs.length) return;
    if (!activeGroup || !groupTabs.includes(activeGroup)) {
      setActiveGroup(groupTabs[0]);
    }
  }, [groupTabs, activeGroup]);

  useEffect(() => {
    setTeamFilter("all");
  }, [activeGroup]);

  const activeMatches = useMemo(() => {
    const current = activeGroup
      ? groupMatchesByGroup[activeGroup]?.matches ?? []
      : [];

    return [...current].sort(
      (a, b) => (a.round ?? 0) - (b.round ?? 0) || a.id - b.id
    );
  }, [activeGroup, groupMatchesByGroup]);

  const activeTeams = useMemo(() => {
    if (isRoundRobin) {
      return teamsByGroup.All ?? [];
    }

    return activeGroup ? teamsByGroup[activeGroup] ?? [] : [];
  }, [activeGroup, teamsByGroup, isRoundRobin]);

  const filteredMatches = useMemo(() => {
    if (teamFilter === "all") return activeMatches;

    return activeMatches.filter(
      (m) => m.teamAId === teamFilter || m.teamBId === teamFilter
    );
  }, [activeMatches, teamFilter]);

  const matchesByRound = useMemo(() => {
    if (!isRoundRobin) return {};
    return filteredMatches.reduce<Record<number, Match[]>>((acc, m) => {
      const r = m.round ?? 0;
      if (!acc[r]) acc[r] = [];
      acc[r].push(m);
      return acc;
    }, {});
  }, [filteredMatches, isRoundRobin]);

  const roundKeys = useMemo(
    () => Object.keys(matchesByRound).map(Number).sort((a, b) => a - b),
    [matchesByRound]
  );

  const groupStandings = useMemo<StandingRow[]>(() => {
    const rows: Record<number, StandingRow> = {};

    for (const team of activeTeams) {
      rows[team.id] = {
        teamId: team.id,
        teamName: team.name,
        teamLogoUrl: team.logoUrl ?? null,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
        bodyCount: 0,
      };
    }

    for (const match of activeMatches) {
      if (match.teamAId && !rows[match.teamAId]) {
        rows[match.teamAId] = {
          teamId: match.teamAId,
          teamName: match.teamA?.name ?? "TBD",
          teamLogoUrl: match.teamA?.logoUrl ?? null,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          gf: 0,
          ga: 0,
          gd: 0,
          points: 0,
          bodyCount: 0,
        };
      }

      if (match.teamBId && !rows[match.teamBId]) {
        rows[match.teamBId] = {
          teamId: match.teamBId,
          teamName: match.teamB?.name ?? "TBD",
          teamLogoUrl: match.teamB?.logoUrl ?? null,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          gf: 0,
          ga: 0,
          gd: 0,
          points: 0,
          bodyCount: 0,
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
      .sort(
        (a, b) =>
          b.points - a.points ||
          (isClassic ? b.bodyCount - a.bodyCount : 0) ||
          b.gd - a.gd ||
          b.gf - a.gf ||
          a.teamName.localeCompare(b.teamName)
      );
  }, [activeMatches, activeTeams, isClassic]);

  const matchCountByGroup = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(groupMatchesByGroup).map(([name, data]) => [
          name,
          data.matches.length,
        ])
      ),
    [groupMatchesByGroup]
  );

  if (groupTabs.length === 0) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {isRoundRobin ? "Standings & Matches" : "Group Stage"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            No groups or matches available yet.
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
            : "Browse groups, standings, and fixtures."}
        </p>
      </div>

      {!isRoundRobin && (
        <GroupTabs
          groupTabs={groupTabs}
          activeGroup={activeGroup}
          onSelect={setActiveGroup}
          teamsByGroup={teamsByGroup}
          matchCountByGroup={matchCountByGroup}
        />
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
            {isRoundRobin ? "Score Table" : `Group ${activeGroup}`}
          </h3>
          <span className="text-xs text-slate-400">
            {
              activeMatches.filter(
                (m) =>
                  m.status === "completed" &&
                  m.scoreA != null &&
                  m.scoreB != null
              ).length
            }
            /{activeMatches.length} played
          </span>
        </div>

        <StandingsTable rows={groupStandings} isClassic={isClassic} />

        <FixturesSection
          isRoundRobin={isRoundRobin}
          isClassic={isClassic}
          activeTeams={activeTeams}
          teamFilter={teamFilter}
          onTeamFilterChange={setTeamFilter}
          roundKeys={roundKeys}
          matchesByRound={matchesByRound}
          filteredMatches={filteredMatches}
          getRoundHeading={getPublicRoundHeading}
        />
      </div>
    </section>
  );
}