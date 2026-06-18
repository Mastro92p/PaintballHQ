"use client";

import { use, useMemo, useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { MatchCard } from "@/components/matches/MatchCard";
import { Badge } from "@/components/ui/Badge";
import { formatDate, calcStandings } from "@/lib/utils";
import type { Tournament, Match } from "@/types";

type TournamentDetailResponse = Tournament & {
  teams: { teamId: number; team: { id: number; name: string } | null }[];
  matches: Match[];
};

const statusVariant: Record<string, "default" | "success" | "warning" | "muted"> = {
  upcoming:  "warning",
  active:    "default",
  completed: "muted",
};

type Tab = "standings" | "matches" | "info";

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, loading, error } = useFetch<TournamentDetailResponse>(
    `/api/tournaments/${id}`
  );
  const [activeTab, setActiveTab] = useState<Tab>("standings");

  const teamMap = useMemo(() => {
    if (!data) return {};
    const map: Record<number, string> = {};
    data.teams?.forEach((tt) => {
      if (tt.team?.name) map[tt.teamId] = tt.team.name;
    });
    data.matches?.forEach((m) => {
      if (m.teamA?.name && !map[m.teamAId]) map[m.teamAId] = m.teamA.name;
      if (m.teamB?.name && !map[m.teamBId]) map[m.teamBId] = m.teamB.name;
    });
    return map;
  }, [data]);

  const standings = useMemo(() => {
    if (!data?.matches) return [];
    const enrolledIds = data.teams?.map((tt) => tt.teamId) ?? [];
    return calcStandings(data.matches, teamMap, enrolledIds);
  }, [data, teamMap]);

  const matchesByRound = useMemo(() => {
    if (!data?.matches) return {};
    return data.matches.reduce<Record<number, Match[]>>((acc, m) => {
      const r = m.round ?? 0;
      if (!acc[r]) acc[r] = [];
      acc[r].push(m);
      return acc;
    }, {});
  }, [data]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="h-8 w-64 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-40 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-10 w-72 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10 text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Tournament not found</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "standings", label: "Standings", count: standings.length },
    { key: "matches",   label: "Matches",   count: data.matches?.length ?? 0 },
    { key: "info",      label: "Info" },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <section className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.name}</h1>
          <Badge variant={statusVariant[data.status] ?? "muted"}>{data.status}</Badge>
        </div>
        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          <span>📅 {formatDate(data.date)}</span>
          {data.location && <span>📍 {data.location}</span>}
          {data.teams   && <span>👥 {data.teams.length} teams</span>}
          {data.matches && <span>🎮 {data.matches.length} matches</span>}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Standings ───────────────────────────────────── */}
      {activeTab === "standings" && (
        <section>
          {standings.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-lg font-medium">No standings yet</p>
              <p className="text-sm mt-1">Standings will appear once teams are enrolled</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
                  <tr>
                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-left w-8">#</th>
                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-left">Team</th>
                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">P</th>
                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-center font-semibold text-green-600 dark:text-green-400">W</th>
                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">D</th>
                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-center font-semibold text-red-500 dark:text-red-400">L</th>
                    <th className="hidden sm:table-cell px-2 py-2 sm:px-4 sm:py-3 text-center">GF</th>
                    <th className="hidden sm:table-cell px-2 py-2 sm:px-4 sm:py-3 text-center">GA</th>
                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">GD</th>
                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-center font-bold text-orange-500 dark:text-orange-400">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {standings.map((s, i) => {
                    const medal =
                      i === 0 ? "🥇" :
                      i === 1 ? "🥈" :
                      i === 2 ? "🥉" :
                      null;

                    const rowBg =
                      i === 0 ? "bg-yellow-50/60 dark:bg-yellow-900/10" :
                      i === 1 ? "bg-gray-100/60 dark:bg-gray-700/20" :
                      i === 2 ? "bg-orange-50/60 dark:bg-orange-900/10" :
                      "bg-white dark:bg-gray-900";

                    return (
                      <tr key={s.teamId} className={`${rowBg} transition-colors`}>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-center text-base leading-none">
                          {medal ?? <span className="text-sm tabular-nums text-gray-400">{i + 1}</span>}
                        </td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[90px] sm:max-w-none truncate">
                          {s.teamName}
                        </td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-gray-600 dark:text-gray-400">{s.played}</td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-green-600 dark:text-green-400 font-medium">{s.wins}</td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-gray-600 dark:text-gray-400">{s.draws}</td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-red-500 dark:text-red-400 font-medium">{s.losses}</td>
                        <td className="hidden sm:table-cell px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-gray-600 dark:text-gray-400">{s.goalsFor}</td>
                        <td className="hidden sm:table-cell px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-gray-600 dark:text-gray-400">{s.goalsAgainst}</td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-gray-600 dark:text-gray-400">
                          {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                        </td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums font-bold text-orange-500 dark:text-orange-400">
                          {s.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Points: Win = 3 · Draw = 1 · Loss = 0 &nbsp;·&nbsp; Tiebreaker: GD → GF → Head-to-head
              </p>
            </>
          )}
        </section>
      )}

      {/* ── Tab: Matches ────────────────────────────────────── */}
      {activeTab === "matches" && (
        <section className="space-y-6">
          {Object.keys(matchesByRound).length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🎮</p>
              <p className="text-lg font-medium">No matches scheduled yet</p>
            </div>
          ) : (
            Object.entries(matchesByRound)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([round, matches]) => (
                <div key={round} className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-3">
                    <span>{Number(round) === 0 ? "Unassigned" : `Round ${round}`}</span>
                    <span className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matches.map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              ))
          )}
        </section>
      )}

      {/* ── Tab: Info ───────────────────────────────────────── */}
      {activeTab === "info" && (
        <section>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4 max-w-md">
            <div className="space-y-3 text-sm">
              {[
                { label: "Name",     value: data.name },
                { label: "Date",     value: formatDate(data.date) },
                { label: "Location", value: data.location ?? "—" },
                { label: "Status",   value: <Badge variant={statusVariant[data.status] ?? "muted"}>{data.status}</Badge> },
                { label: "Teams",    value: data.teams?.length ?? 0 },
                { label: "Matches",  value: data.matches?.length ?? 0 },
              ].map((row, idx, arr) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between py-2 ${idx < arr.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""}`}
                >
                  <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}