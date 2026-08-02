"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeagueManualStandingTable, LeagueTeam } from "@/types";
import { DivisionFilterChips } from "@/components/ui/DivisionFilterChips";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type Props = {
  leagueId: number;
  tables: LeagueManualStandingTable[];
  leagueTeams: LeagueTeam[];
  onUpdated: () => Promise<void> | void;
  onRegenerate: () => Promise<void> | void;
  regenerating?: boolean;
};

type DraftCell = {
  score: string;
  eventRank: string;
};

type DayToDelete = {
  id: number;
  label: string;
};

type TableToDelete = {
  id: number;
  label: string;
};

function formatDateShort(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

export function LeagueManualRankingsTab({
  leagueId,
  tables,
  leagueTeams,
  onUpdated,
  onRegenerate,
  regenerating = false,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, DraftCell>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [dayToDelete, setDayToDelete] = useState<DayToDelete | null>(null);
  const [tableToDelete, setTableToDelete] = useState<TableToDelete | null>(null);

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
    const unique = new Map<number, { id: number; name: string; isActive?: boolean }>();

    tables.forEach((table) => {
      if (table.divisionId == null) return;

      if (!unique.has(table.divisionId)) {
        unique.set(table.divisionId, {
          id: table.divisionId,
          name: table.division?.name ?? `Division ${table.divisionId}`,
          isActive: table.division?.isActive,
        });
      }
    });

    return Array.from(unique.values());
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
      const res = await fetch(`/api/leagues/${leagueId}/manual-rankings/score`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: dirtyUpdates,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save rankings");
      }

      await onUpdated();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save rankings");
    } finally {
      setSavingKey(null);
    }
  }

  async function confirmDeleteDay() {
    if (!dayToDelete) return;

    setSavingKey(`day:${dayToDelete.id}`);
    try {
      const res = await fetch(
        `/api/leagues/${leagueId}/manual-rankings/days/${dayToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete ranking day");
      }

      setDayToDelete(null);
      await onUpdated();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete ranking day");
    } finally {
      setSavingKey(null);
    }
  }

  async function confirmDeleteTable() {
    if (!tableToDelete) return;

    setSavingKey(`table:${tableToDelete.id}`);
    try {
      const res = await fetch(
        `/api/leagues/${leagueId}/manual-rankings/tables/${tableToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete ranking table");
      }

      setTableToDelete(null);
      await onUpdated();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete ranking table");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleRegenerateClick() {
    if (dirtyUpdates.length > 0) {
      alert("Please save or discard your unsaved changes before regenerating.");
      return;
    }

    await onRegenerate();
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Manual rankings
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Regenerate tables from the league&apos;s currently assigned tournaments.
            Detached days or tables can be removed manually.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRegenerateClick}
          disabled={regenerating || savingKey !== null}
          className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {regenerating ? "Regenerating..." : "Regenerate tables"}
        </button>
      </div>

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
          disabled={!dirtyUpdates.length || savingKey !== null || regenerating}
          className="inline-flex items-center rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingKey === "bulk"
            ? "Saving..."
            : `Save changes${
                dirtyUpdates.length ? ` (${dirtyUpdates.length})` : ""
              }`}
        </button>
      </div>

      {!tables.length ? (
        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No manual ranking tables available yet. Use regenerate to create them
            from eligible league tournaments.
          </p>
        </section>
      ) : tableModels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No manual rankings for this division.
          </p>
        </div>
      ) : (
        tableModels.map((table) => (
          <div
            key={table.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {table.division?.name ?? "Unassigned Division"}
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  Points by tournament day.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (dirtyUpdates.length > 0) {
                    alert("Please save or discard your unsaved changes before deleting a table.");
                    return;
                  }

                  setTableToDelete({
                    id: table.id,
                    label: table.division?.name ?? "Unassigned Division",
                  });
                }}
                disabled={savingKey !== null || regenerating}
                className="inline-flex items-center rounded-md border border-red-200 px-2.5 py-1.5 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Remove table
              </button>
            </div>

            {table.days.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No tournament days found for this division.
              </div>
            ) : table.rows.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No league teams enrolled in this division.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-xs">
                  <thead className="bg-slate-700/85 dark:bg-slate-800/95">
                    <tr>
                      <th className="w-[120px] px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-300 dark:text-slate-300">
                        Team
                      </th>

                      {table.days.map((day) => (
                        <th
                          key={day.id}
                          className="w-[118px] px-1.5 py-2 text-left text-[10px] font-semibold text-slate-300 dark:text-slate-300"
                        >
                          <div className="space-y-1">
                            <div className="line-clamp-3 font-semibold leading-snug text-slate-100 dark:text-slate-100">
                              {day.tournament?.name ?? day.label}
                            </div>
                            <div className="text-[9px] font-normal text-slate-400 dark:text-slate-400">
                              {formatDateShort(day.tournament?.date ?? day.date)}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (dirtyUpdates.length > 0) {
                                  alert("Please save or discard your unsaved changes before deleting a day.");
                                  return;
                                }

                                setDayToDelete({
                                  id: day.id,
                                  label: day.tournament?.name ?? day.label,
                                });
                              }}
                              disabled={savingKey !== null || regenerating}
                              className="inline-flex items-center rounded border border-red-400/30 px-1.5 py-0.5 text-[9px] font-medium text-red-200 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Remove
                            </button>
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
                        <td className="break-words px-2.5 py-2 text-[12px] font-medium leading-snug text-gray-900 dark:text-gray-100">
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
                                  <label className="mb-0.5 block text-[8px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
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
                                    className="h-7 w-full rounded-md border border-gray-200 bg-white px-1.5 text-[11px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                  />
                                </div>

                                <div className="w-[40px] shrink-0">
                                  <label className="mb-0.5 block text-[8px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
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
                                    className="h-7 w-full rounded-md border border-gray-200 bg-white px-1 text-center text-[11px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                  />
                                </div>
                              </div>
                            </td>
                          );
                        })}

                        <td className="whitespace-nowrap px-2.5 py-2 text-right text-[11px] font-semibold tabular-nums text-gray-900 dark:text-gray-100">
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

      <ConfirmModal
        open={!!dayToDelete}
        title={
          dayToDelete
            ? `Remove ranking day "${dayToDelete.label}"?`
            : "Remove ranking day?"
        }
        description="This will permanently delete all saved scores for that ranking day."
        confirmLabel="Delete day"
        cancelLabel="Cancel"
        danger
        requireText="DELETE"
        requireTextLabel='Type "DELETE" to confirm'
        loading={dayToDelete ? savingKey === `day:${dayToDelete.id}` : false}
        onCancel={() => {
          if (dayToDelete && savingKey === `day:${dayToDelete.id}`) return;
          setDayToDelete(null);
        }}
        onConfirm={confirmDeleteDay}
      />

      <ConfirmModal
        open={!!tableToDelete}
        title={
          tableToDelete
            ? `Remove ranking table "${tableToDelete.label}"?`
            : "Remove ranking table?"
        }
        description="This will permanently delete all days and saved scores in this ranking table."
        confirmLabel="Delete table"
        cancelLabel="Cancel"
        danger
        requireText="DELETE"
        requireTextLabel='Type "DELETE" to confirm'
        loading={tableToDelete ? savingKey === `table:${tableToDelete.id}` : false}
        onCancel={() => {
          if (tableToDelete && savingKey === `table:${tableToDelete.id}`) return;
          setTableToDelete(null);
        }}
        onConfirm={confirmDeleteTable}
      />
    </section>
  );
}

export default LeagueManualRankingsTab;