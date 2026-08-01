"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import type { Match, Team, TournamentDetail } from "@/types";
import { TabSelector } from "@/components/ui/TabSelector";
import { TournamentHeader } from "@/components/tournaments/TournamentHeader";
import PublicGroupStage from "@/components/ui/PublicGroupStage";
import { PublicTournamentInfo } from "@/components/tournaments/PublicTournamentInfo";
import PublicStandingsTable from "@/components/tournaments/PublicStandingsTable";
import { BracketTab } from "@/components/tournament-detail/BracketTab";

type Tab = "standings" | "groupStage" | "bracket" | "info";

const ROUND_ROBIN_TYPES = ["round_robin", "round_robin_classic"] as const;

export default function TournamentPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("groupStage");
  const [activeBracketId, setActiveBracketId] = useState<number | null>(null);

  const { data, loading, error } = useFetch<TournamentDetail>(`/api/public/tournaments/${id}`);
  //const { data: allTeams } = useFetch<Team[]>("/api/teams");

  const isRoundRobin = useMemo(
    () => ROUND_ROBIN_TYPES.includes(data?.type as any),
    [data?.type]
  );

  const brackets = data?.brackets ?? [];

  useEffect(() => {
    if (!data) return;

    if (activeBracketId != null && brackets.some((b) => b.id === activeBracketId)) {
      return;
    }

    if (brackets.length > 0) {
      setActiveBracketId(brackets[0].id);
    } else {
      setActiveBracketId(null);
    }
  }, [data, brackets, activeBracketId]);

  const groupStageCount =
    data?.matches?.filter((match) => match.phase === "group").length ?? 0;

  const bracketCount =
    data?.matches?.filter((match) => match.phase && match.phase !== "group").length ?? 0;

  const groupStageLabel = isRoundRobin ? "Game Details" : "Group Stage";

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "standings", label: "Standings", count: data?.teams?.length ?? 0 },
    {
      key: "groupStage",
      label: groupStageLabel,
      count: isRoundRobin ? (data?.matches?.length ?? 0) : groupStageCount,
    },
    ...(!isRoundRobin
      ? [{ key: "bracket" as Tab, label: "Bracket", count: bracketCount }]
      : []),
    { key: "info", label: "Info" },
  ];

  const hasGroupMatches = useMemo(
    () => data?.matches.some((m) => m.phase === "group") ?? false,
    [data]
  );

  const isGroupAndBracket = data?.type === "group_and_bracket";

  const groupMatchesByGroup = useMemo(() => {
    if (!data?.matches) return {};

    return data.matches
      .filter((m) => m.phase === "group")
      .reduce<Record<string, Match[]>>((acc, m) => {
        const groupKey = m.group?.name ?? "Ungrouped";
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(m);
        return acc;
      }, {});
  }, [data]);

  const groupTabs = useMemo(
    () => Object.keys(groupMatchesByGroup).sort((a, b) => a.localeCompare(b)),
    [groupMatchesByGroup]
  );

  const [activeGroup, setActiveGroup] = useState<string>("");

  useEffect(() => {
    if (!groupTabs.length) return;
    if (!activeGroup || !groupTabs.includes(activeGroup)) {
      setActiveGroup(groupTabs[0]);
    }
  }, [groupTabs, activeGroup]);

  const activeMatches = activeGroup ? groupMatchesByGroup[activeGroup] ?? [] : [];

  const activeBracketMatches = useMemo(
    () =>
      data?.matches.filter(
        (m) => m.phase && m.phase !== "group" && m.bracketId === activeBracketId
      ) ?? [],
    [data?.matches, activeBracketId]
  );

  const hasBracketMatches = activeBracketMatches.length > 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#07131f] dark:text-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="space-y-4 animate-pulse">
            <div className="h-10 w-72 rounded-xl bg-slate-200 dark:bg-white/10" />
            <div className="h-5 w-96 rounded-lg bg-slate-200 dark:bg-white/10" />
            <div className="h-12 w-[520px] rounded-2xl bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#07131f] dark:text-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
            Tournament not found
          </div>
        </div>
      </main>
    );
  }

  return (
  <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#07131f] dark:text-white">
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="space-y-5">
        <TournamentHeader tournament={data}  />

          <TabSelector tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === "standings" && (
            <PublicStandingsTable
              tournamentType={data.type}
              teams={data.teams}
              matches={data.matches}
              formatConfig={data.formatConfig as {
                qualifiersPerGroup?: number;
                wildCardCount?: number;
              }}
            />
          )}

          {activeTab === "groupStage" && (
            <PublicGroupStage
              matches={data.matches}
              groups={data.groups ?? []}
              teams={data.teams}
              isGroupAndBracket={isGroupAndBracket}
              hasGroupMatches={hasGroupMatches}
              tournamentType={data.type}
              isRoundRobin={isRoundRobin}
            />
          )}

          {activeTab === "bracket" && !isRoundRobin && (
            <BracketTab
              brackets={brackets}
              activeBracketId={activeBracketId}
              onSelectBracket={setActiveBracketId}
              matches={activeBracketMatches}
              hasBracketMatches={hasBracketMatches}
              readonly
            />
          )}

          {activeTab === "info" && data && <PublicTournamentInfo tournament={data} />}
        </section>
      </div>
    </main>
  );
}