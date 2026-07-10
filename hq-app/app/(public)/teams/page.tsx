"use client";

import { useState, useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import type { Team } from "@/types";

type TeamWithStats = Team & {
  tournamentCount?: number;
  totalMatches?: number;
  wins?: number;
  matchesA?: MatchDetail[];
  matchesB?: MatchDetail[];
};

type MatchDetail = {
  id: number;
  status: string;
  round: number | null;
  scoreA: number | null;
  scoreB: number | null;
  teamAId: number;
  teamBId: number;
  teamA?: { id: number; name: string };
  teamB?: { id: number; name: string };
  tournament?: { id: number; name: string };
};

type TeamDetail = Team & {
  matchesA: MatchDetail[];
  matchesB: MatchDetail[];
  tournaments: { tournament: { id: number; name: string } }[];
};

function WinRateBar({ wins, total }: { wins: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((wins / total) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="w-16 sm:w-40 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300 font-medium w-9">
        {pct}%
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 min-w-0">
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <span
        className={`text-2xl sm:text-3xl font-bold tabular-nums ${
          color ?? "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ResultBadge({ result }: { result: "W" | "D" | "L" }) {
  const styles = {
    W: "bg-green-500/10 text-green-500 dark:text-green-400",
    D: "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
    L: "bg-red-500/10 text-red-500 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${styles[result]}`}
    >
      {result}
    </span>
  );
}

function TeamHistoryModalContent({ team }: { team: TeamWithStats }) {
  const allMatches = [
    ...(team.matchesA ?? []).map((m) => ({
      ...m,
      opponent: m.teamB,
      myScore: m.scoreA,
      oppScore: m.scoreB,
      tournamentName: m.tournament?.name ?? "—",
    })),
    ...(team.matchesB ?? []).map((m) => ({
      ...m,
      opponent: m.teamA,
      myScore: m.scoreB,
      oppScore: m.scoreA,
      tournamentName: m.tournament?.name ?? "—",
    })),
  ]
    .filter((m) => m.status === "completed")
    .sort((a, b) => (a.round ?? 0) - (b.round ?? 0));

  const played = allMatches.length;
  const won = allMatches.filter((m) => (m.myScore ?? 0) > (m.oppScore ?? 0)).length;
  const drawn = allMatches.filter((m) => m.myScore === m.oppScore).length;
  const lost = allMatches.filter((m) => (m.myScore ?? 0) < (m.oppScore ?? 0)).length;

  function getResult(m: (typeof allMatches)[0]): "W" | "D" | "L" {
    if (m.myScore === null || m.oppScore === null) return "D";
    if (m.myScore > m.oppScore) return "W";
    if (m.myScore < m.oppScore) return "L";
    return "D";
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <StatCard label="Played" value={played} />
        <StatCard label="Won" value={won} color="text-green-500 dark:text-green-400" />
        <StatCard label="Drawn" value={drawn} color="text-gray-400 dark:text-gray-500" />
        <StatCard label="Lost" value={lost} color="text-red-500 dark:text-red-400" />
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
          Match History
        </h3>

        {allMatches.length === 0 ? (
          <p className="text-sm text-center py-8 text-gray-400 dark:text-gray-500">
            No completed matches yet
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 uppercase text-xs tracking-widest">
                <tr>
                  <th className="px-4 py-2.5 text-left">Tournament</th>
                  <th className="px-4 py-2.5 text-left">Round</th>
                  <th className="px-4 py-2.5 text-left">Opponent</th>
                  <th className="px-4 py-2.5 text-left">Score</th>
                  <th className="px-4 py-2.5 text-left">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {allMatches.map((m) => (
                  <tr key={m.id} className="bg-white dark:bg-gray-900">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {m.tournamentName}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 tabular-nums">
                      R{m.round ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      {m.opponent?.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-gray-700 dark:text-gray-300">
                      {m.myScore}–{m.oppScore}
                    </td>
                    <td className="px-4 py-3">
                      <ResultBadge result={getResult(m)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamsPage() {
  const { data, loading, error } = useFetch<TeamWithStats[]>("/api/teams");
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamWithStats | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Teams</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {data
            ? `${data.length} team${data.length !== 1 ? "s" : ""} registered`
            : "All registered paintball teams"}
        </p>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">
          <p className="text-lg font-medium">Failed to load teams</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {filtered.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-widest">
                  <tr>
                    <th className="px-3 py-3 sm:px-5 text-left">Team Name</th>
                    <th className="hidden sm:table-cell px-5 py-3 text-left">Tournaments</th>
                    <th className="hidden sm:table-cell px-5 py-3 text-left">Total Matches</th>
                    <th className="px-3 py-3 sm:px-5 text-left">Win Rate</th>
                    <th className="px-3 py-3 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filtered.map((t) => {
                    const tournaments = t.tournamentCount ?? 0;
                    const totalMatches = t.totalMatches ?? 0;
                    const wins = t.wins ?? 0;

                    return (
                      <tr
                        key={t.id}
                        className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                              >
                        <td className="px-3 py-4 sm:px-5 font-semibold text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                              {t.logoUrl ? (
                                <img
                                  src={t.logoUrl}
                                  alt={`${t.name} logo`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="text-[9px] text-gray-400">—</span>
                              )}
                            </div>
                            <span>{t.name}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-5 py-4 text-gray-700 dark:text-gray-300 tabular-nums">
                          {tournaments}
                        </td>
                        <td className="hidden sm:table-cell px-5 py-4 text-gray-700 dark:text-gray-300 tabular-nums">
                          {totalMatches}
                        </td>
                        <td className="px-3 py-4 sm:px-5">
                          <WinRateBar wins={wins} total={totalMatches} />
                        </td>
                        <td className="px-3 py-4 sm:px-5 text-right">
                          <button
                            onClick={() => setSelectedTeam(t)}
                            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            History
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : data && data.length > 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-lg font-medium">No teams found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-lg font-medium">No teams yet</p>
            </div>
          )}
        </>
      )}

      {selectedTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTeam(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className="relative z-10 w-full max-w-[640px] bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col max-h-[85dvh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                {selectedTeam.logoUrl ? (
                  <img
                    src={selectedTeam.logoUrl}
                    alt={`${selectedTeam.name} logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-gray-400">—</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {selectedTeam.name}
              </h2>
            </div>
            <button
              onClick={() => setSelectedTeam(null)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

            <div className="overflow-y-auto flex-1 px-4 sm:px-5 py-4 sm:py-5">
              <TeamHistoryModalContent team={selectedTeam} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}