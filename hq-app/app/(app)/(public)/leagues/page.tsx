"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import type { League, Tournament } from "@/types";

type LeagueWithDetails = League & {
  tournaments: (Tournament & { division: { id: number; name: string } | null })[];
  teams: { teamId: number; team: { id: number; name: string } | null }[];
};

export default function LeaguesPage() {
  const { data, loading, error } = useFetch<LeagueWithDetails[]>("/api/public/leagues");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(
      (l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        (l.description ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Leagues
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data
              ? `${data.length} league${data.length !== 1 ? "s" : ""} total`
              : "Browse all paintball leagues"}
          </p>
        </div>

        <div className="relative">
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
            placeholder="Search leagues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 w-64"
          />
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">
          <p className="text-lg font-medium">Failed to load leagues</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((l) => {
                const tournamentCount = l.tournaments?.length ?? 0;
                const teamCount = l.teams?.length ?? 0;
                const activeCount =
                  l.tournaments?.filter((t) => t.status === "active").length ?? 0;
                const toCheckCount =
                  l.tournaments?.filter((t) => t.status === "to_check").length ?? 0;
                const divisionCount = new Set(
                  l.tournaments?.map((t) => t.division?.id).filter((id): id is number => id != null)
                ).size;

                return (
                  <button
                    key={l.id}
                    onClick={() => router.push(`/leagues/${l.id}`)}
                    className="w-full text-left flex items-center gap-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden group"
                  >
                    <div className="relative flex-1 min-w-0 self-stretch overflow-hidden">
                      {l.logoUrl ? (
                        <img
                          src={l.logoUrl}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover opacity-45 dark:opacity-40"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-teal-100 dark:bg-teal-900/30">
                          <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            className="text-teal-600 dark:text-teal-400"
                          >
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/60 to-white dark:from-gray-900/10 dark:via-gray-900/60 dark:to-gray-900" />

                      <div className="relative z-10 px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                            {l.name}
                          </span>

                          {activeCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              {activeCount} active
                            </span>
                          )}

                          {toCheckCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                              {toCheckCount} to check
                            </span>
                          )}
                        </div>

                        {l.description && (
                          <p className="hidden sm:block text-xs text-white-700 dark:text-white-300 mt-1 truncate max-w-md [text-shadow:0_1px_2px_rgba(255,255,255,0.6)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
                            {l.description}
                          </p>
                        )}

<div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap [text-shadow:0_1px_2px_rgba(255,255,255,0.6)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
  <span className="text-xs text-gray-600 dark:text-gray-300">
    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
      {tournamentCount}
    </span>{" "}
    tournaments
  </span>
  <span className="text-gray-400 dark:text-gray-500">·</span>
  <span className="text-xs text-gray-600 dark:text-gray-300">
    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
      {teamCount}
    </span>{" "}
    teams
  </span>
</div>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-8 px-6 py-4 border-l border-gray-100 dark:border-gray-800 shrink-0">
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                          Divisions
                        </p>
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                          {divisionCount}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                          Tournaments
                        </p>
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                          {tournamentCount}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                          Teams
                        </p>
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                          {teamCount}
                        </p>
                      </div>
                    </div>

                    <div className="pr-4 pl-2 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors shrink-0">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-lg font-medium">No leagues found</p>
              <p className="text-sm mt-1">Try adjusting your search</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}