"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import type { Match, Team, TournamentDetail } from "@/types";
import { TabSelector } from "@/components/ui/TabSelector";
import { TournamentHeader } from "@/components/tournaments/TournamentHeader";
import PublicGroupStage from "@/components/ui/PublicGroupStage";
import { PublicTournamentInfo } from "@/components/tournaments/PublicTournamentInfo";
import PublicStandingsTable from "@/components/tournaments/PublicStandingsTable";


type Tab = "standings" | "groupStage" | "bracket" | "info";


export default function TournamentPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("groupStage");

  const { data, loading, error } = useFetch<TournamentDetail>(`/api/tournaments/${id}`);
  const { data: allTeams } = useFetch<Team[]>("/api/teams");


  const groupStageCount =
    data?.matches?.filter((match) => match.phase === "group").length ?? 0;

  const bracketCount =
    data?.matches?.filter((match) => match.phase && match.phase !== "group").length ?? 0;

  const groupStageLabel =
    data?.type === "round_robin" ? "Game Details" : "Group Stage";

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "standings", label: "Standings", count: data?.teams?.length ?? 0 },
    { key: "groupStage", label: groupStageLabel, count: groupStageCount },
    ...(data?.type !== "round_robin"
      ? [{ key: "bracket" as Tab, label: "Bracket", count: bracketCount }]
      : []),
    { key: "info", label: "Info" },
  ];

  const hasBracketMatches = useMemo(
    () =>
      data?.matches.some(
        (m) =>
          m.phase &&
          m.phase !== "group"
      ) ?? false,
    [data]
  );


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
        const group = m.group ?? "Ungrouped";
        if (!acc[group]) acc[group] = [];
        acc[group].push(m);
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


  if (loading) {
    return (
      <main className="min-h-screen bg-[#07131f] text-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="space-y-4 animate-pulse">
            <div className="h-10 w-72 rounded-xl bg-white/10" />
            <div className="h-5 w-96 rounded-lg bg-white/10" />
            <div className="h-12 w-[520px] rounded-2xl bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#07131f] text-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Tournament not found
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07131f] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <section className="space-y-5">
          <TournamentHeader tournament={data} theme="dark" />

          <TabSelector
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === "standings" && (<PublicStandingsTable
            tournamentType={data.type}
            teams={data.teams}
            matches={data.matches}
            formatConfig={data.formatConfig as {
            qualifiersPerGroup?: number;
            wildCardCount?: number;
               }}
          />)}

          {activeTab === "groupStage" && (<PublicGroupStage 
            matches={data.matches}
            isGroupAndBracket={isGroupAndBracket} 
            hasGroupMatches={hasGroupMatches}
            tournamentType={data.type}
          />)}

          {activeTab === "bracket" && (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-slate-400">
            Active tab: <span className="font-medium text-slate-200">{activeTab} 2</span>
          </div>
                )}

          {activeTab === "info" && data && (
            <PublicTournamentInfo tournament={data} />
          )}         


        </section>
      </div>
    </main>
  );
} //"standings" | "groupStage" | "bracket" | "info";