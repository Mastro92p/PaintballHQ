"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import { Badge } from "@/components/ui/Badge";
import { formatDate, calcStandings } from "@/lib/utils";
import type { League, Tournament, Match } from "@/types";

type LeagueTeam = { teamId: number; team: { id: number; name: string } | null };

type TournamentWithMatches = Tournament & {
  teams: { teamId: number; team: { id: number; name: string } | null }[];
  matches: Match[];
};

type LeagueDetailResponse = League & {
  tournaments: TournamentWithMatches[];
  teams: LeagueTeam[];
};

const statusVariant: Record<string, "default" | "success" | "warning" | "muted"> = {
  upcoming:  "warning",
  active:    "default",
  completed: "muted",
};

const STATUS_DOT: Record<string, string> = {
  active:    "bg-green-500",
  upcoming:  "bg-orange-400",
  completed: "bg-gray-400",
};

type Tab = "tournaments" | "standings" | "teams";

function formatDateBlock(dateStr: string) {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day:   d.getDate(),
    year:  d.getFullYear(),
  };
}

export default function LeagueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, loading, error } = useFetch<LeagueDetailResponse>(`/api/leagues/${id}`);
  const [activeTab, setActiveTab] = useState<Tab>("tournaments");
  const router = useRouter();

  // League-wide standings: aggregate all matches across all tournaments
  const leagueStandings = useMemo(() => {
    if (!data?.tournaments) return [];

    const teamMap: Record<number, string> = {};
    const allMatches: Match[] = [];

    data.tournaments.forEach((t) => {
      t.teams?.forEach((tt) => {
        if (tt.team?.name) teamMap[tt.teamId] = tt.team.name;
      });
      t.matches?.forEach((m) => {
        if (m.teamA?.name) teamMap[m.teamAId] = m.teamA.name;
        if (m.teamB?.name) teamMap[m.teamBId] = m.teamB.name;
        allMatches.push(m);
      });
    });

    // Also include league-level registered teams
    data.teams?.forEach((lt) => {
      if (lt.team?.name) teamMap[lt.teamId] = lt.team.name;
    });

    const enrolledIds = data.teams?.map((lt) => lt.teamId) ?? [];
    return calcStandings(allMatches, teamMap, enrolledIds);
  }, [data]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="h-8 w-64 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-40 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-10 w-72 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="space-y-3 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10 text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">League not found</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "tournaments", label: "Tournaments", count: data.tournaments?.length ?? 0 },
    { key: "standings",   label: "Standings",   count: leagueStandings.length },
    { key: "teams",       label: "Teams",        count: data.teams?.length ?? 0 },
  ];

  const totalMatches  = data.tournaments?.reduce((acc, t) => acc + (t.matches?.length ?? 0), 0) ?? 0;
  const activeCount   = data.tournaments?.filter((t) => t.status === "active").length ?? 0;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <section className="space-y-2">
        <div className="flex items-center gap-4 flex-wrap">
          {data.logoUrl && (
            <img
              src={data.logoUrl}
              alt={data.name}
              width={48}
              height={48}
              loading="lazy"
              className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.name}</h1>
          {activeCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {activeCount} active
            </span>
          )}
        </div>
        {data.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{data.description}</p>
        )}
        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          <span>🏆 {data.tournaments?.length ?? 0} tournaments</span>
          <span>👥 {data.teams?.length ?? 0} teams</span>
          <span>🎮 {totalMatches} matches</span>
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

      {/* ── Tab: Tournaments ────────────────────────────────── */}
      {activeTab === "tournaments" && (
        <section className="space-y-2">
          {!data.tournaments?.length ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-lg font-medium">No tournaments yet</p>
            </div>
          ) : (
            data.tournaments
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((t) => {
                const { month, day, year } = formatDateBlock(t.date);
                const teamCount    = t.teams?.length ?? 0;
                const playedCount  = t.matches?.filter((m) => m.status === "completed").length ?? 0;

                return (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/tournaments/${t.id}`)}
                    className="w-full text-left flex items-center gap-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden group"
                  >
                    {/* Date block */}
                    <div className="flex flex-col items-center justify-center w-20 shrink-0 px-3 py-4 border-r border-gray-100 dark:border-gray-800 self-stretch">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none">{month}</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight tabular-nums">{day}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 leading-none">{year}</span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0 px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">{t.name}</span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                          t.status === "active"    ? "text-green-600 dark:text-green-400" :
                          t.status === "upcoming"  ? "text-orange-500 dark:text-orange-400" :
                          "text-gray-400 dark:text-gray-500"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[t.status] ?? "bg-gray-400"}`} />
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 capitalize hidden sm:inline">
                          {(t.type ?? "round_robin").replace(/_/g, " ")}
                        </span>
                      </div>
                      {t.location && (
                        <div className="hidden sm:flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {t.location}
                        </div>
                      )}

                      {/* Mobile stats */}
                      <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{teamCount}</span> teams
                        </span>
                        <span className="text-gray-300 dark:text-gray-700">·</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{playedCount}</span> played
                        </span>
                      </div>
                    </div>

                    {/* Desktop stats */}
                    <div className="hidden sm:flex items-center gap-8 px-6 py-4 border-l border-gray-100 dark:border-gray-800 shrink-0">
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">Teams</p>
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">{teamCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">Played</p>
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">{playedCount}</p>
                      </div>
                    </div>

                    {/* Chevron */}
                    <div className="pr-4 pl-2 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </div>
                  </button>
                );
              })
          )}
        </section>
      )}

      {/* ── Tab: Standings (league-wide) ─────────────────────── */}
      {activeTab === "standings" && (
        <section>
          {leagueStandings.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-lg font-medium">No standings yet</p>
              <p className="text-sm mt-1">Standings will appear once matches are played</p>
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
                    {leagueStandings.map((s, i) => {
                      const medal =
                        i === 0 ? "🥇" :
                        i === 1 ? "🥈" :
                        i === 2 ? "🥉" : null;

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
                League-wide standings across all tournaments · Points: Win = 3 · Draw = 1 · Loss = 0
              </p>
            </>
          )}
        </section>
      )}

      {/* ── Tab: Teams ──────────────────────────────────────── */}
      {activeTab === "teams" && (
        <section>
          {!data.teams?.length ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-lg font-medium">No teams registered</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Team</th>
                    <th className="px-4 py-3 text-center">Tournaments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.teams.map((lt, i) => {
                    const tournamentsPlayed = data.tournaments?.filter((t) =>
                      t.teams?.some((tt) => tt.teamId === lt.teamId)
                    ).length ?? 0;

                    return (
                      <tr key={lt.teamId} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-3 text-gray-400 tabular-nums">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {lt.team?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums text-gray-600 dark:text-gray-400">
                          {tournamentsPlayed}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

    </main>
  );
}