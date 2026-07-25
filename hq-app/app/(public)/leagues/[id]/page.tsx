"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import type {
  LeagueDetailResponse,
  LeagueManualStandingTable,
} from "@/types";

import LeagueManualStandingsPublicTable from "@/components/leagues/LeagueManualStandingsPublicTable";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  upcoming: "Upcoming",
  to_check: "To Check",
  completed: "Completed",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-green-500",
  upcoming: "bg-orange-400",
  to_check: "bg-yellow-400",
  completed: "bg-gray-400",
};

const STATUS_TEXT: Record<string, string> = {
  active: "text-green-600 dark:text-green-400",
  upcoming: "text-orange-500 dark:text-orange-400",
  to_check: "text-yellow-600 dark:text-yellow-400",
  completed: "text-gray-400 dark:text-gray-500",
};

type Tab = "tournaments" | "standings" | "teams";
type DivFilter = number | "all";

function formatDateBlock(dateStr: string) {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate(),
    year: d.getFullYear(),
  };
}

function formatDateShort(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function DivisionPills({
  divisions,
  value,
  onChange,
}: {
  divisions: { id: number; name: string }[];
  value: DivFilter;
  onChange: (v: DivFilter) => void;
}) {
  if (!divisions.length) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange("all")}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          value === "all"
            ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        All divisions
      </button>

      {divisions.map((d) => (
        <button
          key={d.id}
          onClick={() => onChange(d.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            value === d.id
              ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {d.name}
        </button>
      ))}
    </div>
  );
}

export default function LeagueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, loading, error } = useFetch<LeagueDetailResponse>(`/api/public/leagues/${id}`);
  const [activeTab, setActiveTab] = useState<Tab>("tournaments");
  const [tournamentDivFilter, setTournamentDivFilter] = useState<DivFilter>("all");
  const [teamDivFilter, setTeamDivFilter] = useState<DivFilter>("all");
  const [standingsDivFilter, setStandingsDivFilter] = useState<DivFilter>("all");

  const router = useRouter();

  const divisions = useMemo(() => {
    if (!data) return [];
    const map: Record<number, string> = {};

    data.tournaments?.forEach((t) => {
      if (t.division) map[t.division.id] = t.division.name;
    });

    data.teams?.forEach((lt) => {
      if (lt.team?.division) map[lt.team.division.id] = lt.team.division.name;
    });

    data.manualStandingTables?.forEach((table) => {
      if (table.division) map[table.division.id] = table.division.name;
    });

    return Object.entries(map)
      .map(([id, name]) => ({ id: Number(id), name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const filteredTournaments = useMemo(() => {
    if (!data?.tournaments) return [];
    if (tournamentDivFilter === "all") return data.tournaments;

    return data.tournaments.filter(
      (t) => t.divisionId === tournamentDivFilter || t.division?.id === tournamentDivFilter
    );
  }, [data, tournamentDivFilter]);

  const filteredTeams = useMemo(() => {
    if (!data?.teams) return [];
    if (teamDivFilter === "all") return data.teams;
    return data.teams.filter((lt) => lt.team?.divisionId === teamDivFilter);
  }, [data, teamDivFilter]);

  const manualStandingsByDivision = useMemo(() => {
    if (!data?.manualStandingTables) return [];

    return data.manualStandingTables
      .filter((table) => table.divisionId != null)
      .map((table) => {
        const teams =
          data.teams
            ?.filter((lt) => lt.team?.divisionId === table.divisionId)
            .map((lt) => lt.team)
            .filter(Boolean) ?? [];

        const scoreMap = new Map<string, { score: number | null; eventRank: number | null }>();

        table.days.forEach((day) => {
          day.scores.forEach((score) => {
            scoreMap.set(`${day.id}:${score.teamId}`, {
              score: score.score,
              eventRank: score.eventRank ?? null,
            });
          });
        });

        const rows = teams.map((team) => {
          let totalScore = 0;
          let hasAnyScore = false;

          const cells = table.days.map((day) => {
            const saved = scoreMap.get(`${day.id}:${team!.id}`);

            if (saved?.score != null) {
              totalScore += saved.score;
              hasAnyScore = true;
            }

            return {
              dayId: day.id,
              savedScore: saved?.score ?? null,
              savedEventRank: saved?.eventRank ?? null,
            };
          });

          return {
            team: team!,
            totalScore: hasAnyScore ? totalScore : null,
            hasAnyScore,
            cells,
          };
        });

        rows.sort((a, b) => {
          const aScore = a.totalScore ?? -1;
          const bScore = b.totalScore ?? -1;
          if (bScore !== aScore) return bScore - aScore;
          return a.team.name.localeCompare(b.team.name);
        });

        const rankedRows = rows.map((row, index) => ({
          ...row,
          place: row.hasAnyScore ? index + 1 : null,
        }));

        return {
          table,
          divisionId: table.divisionId,
          divisionName: table.division?.name ?? "Unassigned",
          rows: rankedRows,
        };
      });
  }, [data]);

  const visibleStandingsGroups = useMemo(() => {
    if (standingsDivFilter === "all") return manualStandingsByDivision;
    return manualStandingsByDivision.filter(
      (group) => group.divisionId === standingsDivFilter
    );
  }, [manualStandingsByDivision, standingsDivFilter]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="h-8 w-64 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-40 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-10 w-72 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="space-y-3 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10 text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          League not found
        </p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "tournaments", label: "Tournaments", count: data.tournaments?.length ?? 0 },
    { key: "standings", label: "Standings", count: manualStandingsByDivision.length },
    { key: "teams", label: "Teams", count: data.teams?.length ?? 0 },
  ];

  const totalMatches =
    data.tournaments?.reduce((acc, t) => acc + (t.matches?.length ?? 0), 0) ?? 0;
  const activeCount =
    data.tournaments?.filter((t) => t.status === "active").length ?? 0;
  const toCheckCount =
    data.tournaments?.filter((t) => t.status === "to_check").length ?? 0;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
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

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {data.name}
          </h1>

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

        {data.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{data.description}</p>
        )}

        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          <span>🏆 {data.tournaments?.length ?? 0} tournaments</span>
          <span>👥 {data.teams?.length ?? 0} teams</span>
          <span>🎮 {totalMatches} matches</span>
        </div>
      </section>

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
              <span
                className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "tournaments" && (
        <section className="space-y-4">
          <DivisionPills
            divisions={divisions}
            value={tournamentDivFilter}
            onChange={setTournamentDivFilter}
          />

          {!filteredTournaments.length ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-lg font-medium">No tournaments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...filteredTournaments]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((t) => {
                  const { month, day, year } = formatDateBlock(t.date);
                  const teamCount = t.teams?.length ?? 0;
                  const playedCount =
                    t.matches?.filter((m) => m.status === "completed").length ?? 0;

                  return (
                    <button
                      key={t.id}
                      onClick={() => router.push(`/tournaments/${t.id}`)}
                      className="w-full text-left flex items-center gap-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden group"
                    >
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

                      <div className="flex-1 min-w-0 px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                            {t.name}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                              STATUS_TEXT[t.status] ?? "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                STATUS_DOT[t.status] ?? "bg-gray-400"
                              }`}
                            />
                            {STATUS_LABELS[t.status] ?? t.status}
                          </span>

                          {t.division && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                              {t.division.name}
                            </span>
                          )}

                          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize hidden sm:inline">
                            {(t.type ?? "round_robin").replace(/_/g, " ")}
                          </span>
                        </div>

                        {t.location && (
                          <div className="hidden sm:flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {t.location}
                          </div>
                        )}

                        <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                              {teamCount}
                            </span>{" "}
                            teams
                          </span>
                          <span className="text-gray-300 dark:text-gray-700">·</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                              {playedCount}
                            </span>{" "}
                            played
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-8 px-6 py-4 border-l border-gray-100 dark:border-gray-800 shrink-0">
                        <div className="text-center">
                          <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                            Teams
                          </p>
                          <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                            {teamCount}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                            Played
                          </p>
                          <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                            {playedCount}
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
          )}
        </section>
      )}

      {activeTab === "standings" && (
        <section className="space-y-6">
          <DivisionPills
            divisions={divisions}
            value={standingsDivFilter}
            onChange={setStandingsDivFilter}
          />

          {visibleStandingsGroups.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-lg font-medium">No standings yet</p>
              <p className="text-sm mt-1">
                Standings will appear once manual rankings are added
              </p>
            </div>
          ) : (
            visibleStandingsGroups.map((group) => (
            <LeagueManualStandingsPublicTable
              key={group.divisionId}
              divisionName={group.divisionName}
              days={group.table.days}
              rows={group.rows}
            />
          )
          ))}
        </section>
      )}

      {activeTab === "teams" && (
        <section className="space-y-4">
          <DivisionPills divisions={divisions} value={teamDivFilter} onChange={setTeamDivFilter} />

          {!filteredTeams.length ? (
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
                    {teamDivFilter === "all" && (
                      <th className="px-4 py-3 text-left">Division</th>
                    )}
                    <th className="px-4 py-3 text-center">Tournaments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTeams.map((lt, i) => {
                    const tournamentsPlayed =
                      data.tournaments?.filter((t) =>
                        t.teams?.some((tt) => tt.teamId === lt.teamId)
                      ).length ?? 0;

                    return (
                      <tr
                        key={lt.teamId}
                        className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400 tabular-nums">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {lt.team?.name ?? "—"}
                        </td>
                        {teamDivFilter === "all" && (
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                            {lt.team?.division?.name ?? "—"}
                          </td>
                        )}
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