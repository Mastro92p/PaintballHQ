"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useFetch } from "@/hooks/use-fetch";
import { WinRateBar } from "@/components/ui/WinRateBar";
import type { Division, TeamWithStats } from "@/types";
import { DivisionFilterChips } from "@/components/divisions/DivisionFilterChips";

export default function TeamsPage() {
  const { data, loading, error } = useFetch<TeamWithStats[]>("/api/teams");
  const { data: divisions } = useFetch<Division[]>("/api/divisions");
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");

  useEffect(() => {
    if (divisionFilter === "all" || divisionFilter === "unassigned") return;
    if (!divisions) return;

    const selectedDivision = divisions.find((d) => String(d.id) === divisionFilter);

    if (!selectedDivision || selectedDivision.isActive === false) {
      setDivisionFilter("all");
    }
  }, [divisionFilter, divisions]);

  const filtered = useMemo(() => {
    if (!data) return [];

    return data
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .filter((t) => {
        const hasInactiveDivision =
          t.divisionId != null && t.division?.isActive === false;

        if (divisionFilter === "all") {
          return !hasInactiveDivision;
        }

        if (divisionFilter === "unassigned") {
          return t.divisionId == null;
        }

        return (
          t.divisionId === Number(divisionFilter) &&
          t.division?.isActive !== false
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, search, divisionFilter]);

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

      <div className="space-y-3">
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

        <DivisionFilterChips
          divisions={divisions}
          value={divisionFilter}
          onChange={setDivisionFilter}
          includeAll
          includeUnassigned
          hideInactive
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
                    <th className="hidden sm:table-cell px-5 py-3 text-left">Division</th>
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
                        <td className="hidden sm:table-cell px-5 py-4 text-gray-700 dark:text-gray-300">
                          {t.division?.name ?? "—"}
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
                          <Link
                            href={`/teams/${t.id}`}
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
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View
                          </Link>
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
    </main>
  );
}