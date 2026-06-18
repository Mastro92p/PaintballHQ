"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import type { Tournament } from "@/types";
import { calcStandings } from "@/lib/utils";

const STATUS_TABS = [
  { value: "",          label: "All" },
  { value: "active",    label: "Active" },
  { value: "upcoming",  label: "Upcoming" },
  { value: "completed", label: "Completed" },
] as const;

const STATUS_DOT: Record<string, string> = {
  active:    "bg-green-500",
  upcoming:  "bg-orange-400",
  completed: "bg-gray-400",
};

function formatDateBlock(dateStr: string) {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day:   d.getDate(),
    year:  d.getFullYear(),
  };
}

function getLeader(tournament: Tournament & { matches?: any[]; teams?: any[] }): string {
  if (!tournament.matches || tournament.matches.length === 0) return "—";

  const enrolledTeamIds = tournament.teams?.map((t: any) => t.teamId) ?? [];

  const teamMap: Record<number, string> = {};
  tournament.teams?.forEach((t: any) => {
    if (t.team?.name) teamMap[t.teamId] = t.team.name;
  });

  const standings = calcStandings(tournament.matches, teamMap, enrolledTeamIds);

  return standings[0]?.teamName ?? "—";
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

type TournamentWithDetails = Tournament & {
  teams?: any[];
  matches?: any[];
  _teamCount?: number;
  _playedCount?: number;
};

export default function TournamentsPage() {
  const { data, loading, error } = useFetch<TournamentWithDetails[]>("/api/tournaments");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();

  const counts = useMemo(() => {
    if (!data) return {} as Record<string, number>;
    const c: Record<string, number> = { "": data.length };
    for (const t of data) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data
      .filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.location ?? "").toLowerCase().includes(search.toLowerCase())
      )
      .filter((t) => status === "" || t.status === status);
  }, [data, search, status]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tournaments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data
              ? `${data.length} tournament${data.length !== 1 ? "s" : ""} total`
              : "Browse all paintball tournaments"}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            placeholder="Search name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 w-64"
          />
        </div>
      </div>


      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full sm:w-fit">
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all duration-200 overflow-hidden
                sm:px-4 sm:flex-none
                ${isActive
                  ? "flex-[2] px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "flex-[1] px-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
            >
              {/* Label: always visible on desktop, only on active on mobile */}
              <span className={`truncate ${isActive ? "inline" : "hidden sm:inline"}`}>
                {tab.label}
              </span>
              {counts[tab.value] !== undefined && (
                <span className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full shrink-0 ${
                  isActive
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                }`}>
                  {counts[tab.value]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12 text-red-500">
          <p className="text-lg font-medium">Failed to load tournaments</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* List */}
      {!loading && !error && (
        <>
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((t) => {
                const { month, day, year } = formatDateBlock(t.date);
                const teamCount   = t.teams?.length ?? t._teamCount ?? 0;
                const playedCount = t.matches?.filter((m: any) => m.status === "completed").length ?? t._playedCount ?? 0;
                const leader      = getLeader(t);

                return (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/tournaments/${t.id}`)}
                    className="w-full text-left flex items-center gap-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden group"
                  >
                    {/* Date block */}
                    <div className="flex flex-col items-center justify-center w-20 shrink-0 px-3 py-4 border-r border-gray-100 dark:border-gray-800 self-stretch">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none">
                        {month}
                      </span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight tabular-nums">
                        {day}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 leading-none">
                        {year}
                      </span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0 px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                          {t.name}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                          t.status === "active"
                            ? "text-green-600 dark:text-green-400"
                            : t.status === "upcoming"
                            ? "text-orange-500 dark:text-orange-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[t.status] ?? "bg-gray-400"}`} />
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
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

                      {/* Mobile stats — single inline row, hidden on sm+ */}
                      <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{teamCount}</span> teams
                        </span>
                        <span className="text-gray-300 dark:text-gray-700">·</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{playedCount}</span> played
                        </span>
                        {leader !== "—" && (
                          <>
                            <span className="text-gray-300 dark:text-gray-700">·</span>
                            <span className="text-xs flex items-center gap-1 text-gray-400 dark:text-gray-500">
                              🏆 <span className="font-semibold text-gray-700 dark:text-gray-300">{truncate(leader, 14)}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Desktop stats — hidden on mobile */}
                    <div className="hidden sm:flex items-center gap-8 px-6 py-4 border-l border-gray-100 dark:border-gray-800 shrink-0">
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">Teams</p>
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">{teamCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">Played</p>
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">{playedCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">Leader</p>
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100">{leader}</p>
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
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-lg font-medium">No tournaments found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter</p>
            </div>
          )}
        </>
      )}

    </main>
  );
}