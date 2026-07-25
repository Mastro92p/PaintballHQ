"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeagueManualStandingTable, LeagueTeam } from "@/types";
import { DivisionFilterChips } from "@/components/divisions/DivisionFilterChips";

type Props = {
  leagueId: number;
  tables: LeagueManualStandingTable[];
  leagueTeams: LeagueTeam[];
  onUpdated: () => Promise<void> | void;
};

type DraftCell = {
  score: string;
  eventRank: string;
};

function formatDateShort(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

export function LeagueManualStandingsTab({
  leagueId,
  tables,
  leagueTeams,
  onUpdated,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, DraftCell>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");

  useEffect(() => {
    const next: Record<string, DraftCell> = {};

    tables.forEach((table) => {
      table.days.forEach((day) => {
        day.scores.forEach((score) => {
          const key = `${day.id}:${score.teamId}`;
          next[key] = {
            score: score.score == null ? "" : String(score.score),
            eventRank: score.eventRank == null ? "" : String(score.eventRank),
          };
        });
      });
    });

    setDrafts(next);
  }, [tables]);

  const divisionOptions = useMemo(() => {
    const options = tables
      .filter(
        (table): table is LeagueManualStandingTable & { divisionId: number } =>
          table.divisionId != null
      )
      .map((table) => ({
        id: table.divisionId,
        name: table.division?.name ?? `Division ${table.divisionId}`,
        isActive: table.division?.isActive,
      }));

    const unique = new Map<number, { id: number; name: string; isActive?: boolean }>();

    options.forEach((option) => {
      if (!unique.has(option.id)) {
        unique.set(option.id, option);
      }
    });

    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tables]);

  const visibleTables = useMemo(() => {
    const assignedTables = tables.filter((table) => table.divisionId != null);

    if (divisionFilter === "all") return assignedTables;

    return assignedTables.filter(
      (table) => table.divisionId === Number(divisionFilter)
    );
  }, [tables, divisionFilter]);

  const tableModels = useMemo(() => {
    return visibleTables.map((table) => {
      const teams = leagueTeams
        .filter((entry) => entry.team && entry.team.divisionId === table.divisionId)
        .map((entry) => entry.team!)
        .sort((a, b) => a.name.localeCompare(b.name));

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
          const key = `${day.id}:${team.id}`;
          const saved = scoreMap.get(key);

          if (saved?.score != null) {
            totalScore += saved.score;
            hasAnyScore = true;
          }

          return {
            key,
            dayId: day.id,
            teamId: team.id,
            savedScore: saved?.score ?? null,
            savedEventRank: saved?.eventRank ?? null,
          };
        });

        return {
          team,
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

      const rowsWithPlace = rows.map((row, index) => ({
        ...row,
        place: row.hasAnyScore ? index + 1 : null,
      }));

      return {
        ...table,
        teams,
        rows: rowsWithPlace,
      };
    });
  }, [visibleTables, leagueTeams]);

  const dirtyUpdates = useMemo(() => {
    const updates: Array<{
      dayId: number;
      teamId: number;
      score: number | null;
      eventRank: number | null;
    }> = [];


    

    tableModels.forEach((table) => {
      table.rows.forEach((row) => {
        row.cells.forEach((cell) => {
          const draft = getDraft(cell.key, cell.savedScore, cell.savedEventRank);

          const normalizedScore =
            draft.score.trim() === "" ? null : Number(draft.score.trim());

          const normalizedEventRank =
            draft.eventRank.trim() === "" ? null : Number(draft.eventRank.trim());

          if (normalizedScore !== null && Number.isNaN(normalizedScore)) return;
          if (normalizedEventRank !== null && Number.isNaN(normalizedEventRank)) return;

          if (
            normalizedScore !== cell.savedScore ||
            normalizedEventRank !== cell.savedEventRank
          ) {
            updates.push({
              dayId: cell.dayId,
              teamId: cell.teamId,
              score: normalizedScore,
              eventRank: normalizedEventRank,
            });
          }
        });
      });
    });

    return updates;
  }, [tableModels, drafts]);

  useEffect(() => {
    if (!dirtyUpdates.length) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [dirtyUpdates.length]);

  function getDraft(
    key: string,
    savedScore: number | null,
    savedEventRank: number | null
  ) {
    return (
      drafts[key] ?? {
        score: savedScore == null ? "" : String(savedScore),
        eventRank: savedEventRank == null ? "" : String(savedEventRank),
      }
    );
  }

  function setDraftValue(
    key: string,
    field: keyof DraftCell,
    value: string,
    savedScore: number | null,
    savedEventRank: number | null
  ) {
    const current = getDraft(key, savedScore, savedEventRank);

    setDrafts((prev) => ({
      ...prev,
      [key]: {
        ...current,
        [field]: value,
      },
    }));
  }

  async function saveAllChanges() {
    if (!dirtyUpdates.length) return;

    setSavingKey("bulk");
    try {
      const res = await fetch("/api/leagues/manual-standings/score", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leagueId,
          updates: dirtyUpdates,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save scores");
      }

      await onUpdated();
    } finally {
      setSavingKey(null);
    }
  }

  if (!tables.length) {
    return (
      <section className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center bg-white dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No manual standing tables available yet.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <style jsx>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type="number"] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>

      <DivisionFilterChips
        divisions={divisionOptions}
        value={divisionFilter}
        onChange={setDivisionFilter}
        includeAll
        highlightInactive
      />

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {dirtyUpdates.length > 0
            ? `${dirtyUpdates.length} unsaved change${
                dirtyUpdates.length === 1 ? "" : "s"
              }`
            : "All changes saved"}
        </div>

        <button
          type="button"
          onClick={saveAllChanges}
          disabled={!dirtyUpdates.length || savingKey === "bulk"}
          className="inline-flex items-center rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingKey === "bulk"
            ? "Saving..."
            : `Save changes${
                dirtyUpdates.length ? ` (${dirtyUpdates.length})` : ""
              }`}
        </button>
      </div>

      {tableModels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center bg-white dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No manual standings for this division.
          </p>
        </div>
      ) : (
        tableModels.map((table) => (
          <div
            key={table.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {table.division?.name ?? "Unassigned Division"}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Manual 100-point standings by tournament day.
                </p>
              </div>
            </div>

            {table.days.length === 0 ? (
              <div className="px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                No tournament days found for this division.
              </div>
            ) : table.rows.length === 0 ? (
              <div className="px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                No league teams enrolled in this division.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs table-fixed">
                  <thead className="bg-slate-700/85 dark:bg-slate-800/95">
                    <tr>
                      <th className="w-[120px] px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-300 dark:text-slate-300">
                        Team
                      </th>

                      {table.days.map((day) => (
                        <th
                          key={day.id}
                          className="px-1.5 py-2 text-left text-[10px] font-semibold text-slate-300 dark:text-slate-300 w-[118px]"
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-100 dark:text-slate-100 normal-case leading-snug line-clamp-3">
                              {day.tournament?.name ?? day.label}
                            </div>
                            <div className="text-[9px] text-slate-400 dark:text-slate-400 font-normal">
                              {formatDateShort(day.tournament?.date ?? day.date)}
                            </div>
                          </div>
                        </th>
                      ))}

                      <th className="w-[64px] px-2.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-300 dark:text-slate-300">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {table.rows.map((row) => (
                      <tr
                        key={row.team.id}
                        className={`align-top ${
                          row.place === 1
                            ? "bg-amber-500/18"
                            : row.place === 2
                            ? "bg-zinc-300/18"
                            : row.place === 3
                            ? "bg-orange-600/18"
                            : ""
                        }`}
                      >
                        <td className="px-2.5 py-2 font-medium text-[12px] text-gray-900 dark:text-gray-100 leading-snug break-words">
                          {row.team.name}
                        </td>

                        {row.cells.map((cell) => {
                          const draft = getDraft(
                            cell.key,
                            cell.savedScore,
                            cell.savedEventRank
                          );

                          return (
                            <td key={cell.key} className="px-1.5 py-2">
                              <div className="flex items-end gap-1">
                                <div className="min-w-0 flex-1">
                                  <label className="block text-[8px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">
                                    Score
                                  </label>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    value={draft.score}
                                    onChange={(e) =>
                                      setDraftValue(
                                        cell.key,
                                        "score",
                                        e.target.value,
                                        cell.savedScore,
                                        cell.savedEventRank
                                      )
                                    }
                                    className="w-full h-7 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-1.5 text-[11px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                                  />
                                </div>

                                <div className="w-[40px] shrink-0">
                                  <label className="block text-[8px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">
                                    Rank
                                  </label>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    step="1"
                                    value={draft.eventRank}
                                    onChange={(e) =>
                                      setDraftValue(
                                        cell.key,
                                        "eventRank",
                                        e.target.value,
                                        cell.savedScore,
                                        cell.savedEventRank
                                      )
                                    }
                                    className="w-full h-7 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-1 text-center text-[11px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                                  />
                                </div>
                              </div>
                            </td>
                          );
                        })}

                        <td className="px-2.5 py-2 text-right font-semibold text-[11px] text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">
                          {row.totalScore == null ? "—" : row.totalScore.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </section>
  );
}

export default LeagueManualStandingsTab;