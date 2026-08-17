import {
  computeGroupedStandings,
  computeRoundRobinStandings,
  applyClassicScoring,
  StandingRow,
  TournamentTeam,
} from "@/lib/standings";
import { Match } from "@/types";
import { getClassicMatchResult } from "@/lib/utils";

type TournamentType =
  | "round_robin"
  | "round_robin_classic"
  | "group_and_bracket"
  | "groupandbracket"
  | "single_elimination";

type FormatConfig = {
  qualifiersPerGroup?: number;
  wildCardCount?: number;
};

type Props = {
  tournamentType: TournamentType | string;
  teams: TournamentTeam[];
  matches: Match[];
  formatConfig?: FormatConfig | null;
  bodyCountEnabled: boolean;
};

function getRowClassName(
  row: StandingRow,
  qualifiersPerGroup: number,
  wildCardIds: Set<number>
) {
  if ((row.groupRank ?? 999) <= qualifiersPerGroup) {
    return "bg-emerald-50 dark:bg-emerald-500/10";
  }

  if (wildCardIds.has(row.teamId)) {
    return "bg-amber-50 dark:bg-amber-500/10";
  }

  return "";
}

function renderGoalDiff(value: number) {
  return value > 0 ? `+${value}` : value;
}

function StandingsTable({
  rows,
  showGroupRank = false,
  showOverallRank = true,
  qualifiersPerGroup = 0,
  wildCardIds = new Set<number>(),
  showBodyCount = false,
}: {
  rows: StandingRow[];
  showGroupRank?: boolean;
  showOverallRank?: boolean;
  qualifiersPerGroup?: number;
  wildCardIds?: Set<number>;
  showBodyCount?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900/60">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-slate-400">
          <tr>
            {showOverallRank && (
              <th className="hidden sm:table-cell px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium">
                Rank
              </th>
            )}
            {showGroupRank && (
              <th className="hidden md:table-cell px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium">
                Grp
              </th>
            )}
            <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-medium">
              Team
            </th>
            <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-right font-medium">
              P
            </th>
            <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
              W
            </th>
            <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-right font-medium text-rose-600 dark:text-rose-400">
              L
            </th>
            <th className="px-2 sm:px-3 py-2.5 sm:py-3 text-right font-medium">
              GD
            </th>
            <th className="hidden sm:table-cell px-3 py-3 text-right font-medium">
              D
            </th>
            <th className="hidden md:table-cell px-3 py-3 text-right font-medium">
              GF
            </th>
            <th className="hidden md:table-cell px-3 py-3 text-right font-medium">
              GA
            </th>
            {showBodyCount && (
              <th className="hidden md:table-cell px-3 py-3 text-right font-medium text-sky-600 dark:text-sky-400">
                BC
              </th>
            )}
            <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-amber-600 dark:text-amber-300">
              PTS
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.teamId}
              className={`border-t border-gray-200 text-gray-700 dark:border-white/10 dark:text-slate-200 ${getRowClassName(
                row,
                qualifiersPerGroup,
                wildCardIds
              )}`}
            >
              {showOverallRank && (
                <td className="hidden sm:table-cell px-3 sm:px-4 py-2.5 sm:py-3 text-gray-600 dark:text-slate-300 tabular-nums">
                  {row.overallRank}
                </td>
              )}

              {showGroupRank && (
                <td className="hidden md:table-cell px-3 sm:px-4 py-2.5 sm:py-3 text-gray-600 dark:text-slate-300 tabular-nums">
                  {row.groupRank}
                </td>
              )}

              <td className="px-2 sm:px-4 py-2.5 sm:py-3 font-medium text-gray-900 dark:text-white min-w-0">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    {row.teamLogoUrl ? (
                      <img
                        src={row.teamLogoUrl}
                        alt={`${row.teamName} logo`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[8px] text-gray-400 dark:text-slate-500">
                        —
                      </span>
                    )}
                  </div>
                  <span className="truncate text-[13px] sm:text-sm leading-tight">
                    {row.teamName}
                  </span>
                </div>
              </td>

              <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-right tabular-nums">
                {row.played}
              </td>
              <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums font-semibold">
                {row.wins}
              </td>
              <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-right text-rose-600 dark:text-rose-400 tabular-nums font-semibold">
                {row.losses}
              </td>
              <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-right tabular-nums">
                {renderGoalDiff(row.gd)}
              </td>
              <td className="hidden sm:table-cell px-3 py-3 text-right tabular-nums">
                {row.draws}
              </td>
              <td className="hidden md:table-cell px-3 py-3 text-right tabular-nums">
                {row.gf}
              </td>
              <td className="hidden md:table-cell px-3 py-3 text-right tabular-nums">
                {row.ga}
              </td>
              {showBodyCount && (
                <td className="hidden md:table-cell px-3 py-3 text-right text-sky-600 dark:text-sky-400 tabular-nums">
                  {row.bodyCount ?? 0}
                </td>
              )}
              <td className="px-2 sm:px-4 py-2.5 sm:py-3 text-right font-semibold text-amber-600 dark:text-amber-300 tabular-nums">
                {row.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PublicStandingsTable({
  tournamentType,
  teams,
  matches,
  formatConfig,
  bodyCountEnabled,
}: Props) {

  const isClassic = tournamentType === "round_robin_classic";
  const shouldUseBodyCount = isClassic || bodyCountEnabled;

  if (tournamentType === "round_robin" || tournamentType === "round_robin_classic") {
    let standings = computeRoundRobinStandings(
      teams,
      matches,
      isClassic ? undefined : { useBodyCount: shouldUseBodyCount }
    );

    if (isClassic) {
      standings = applyClassicScoring(standings, matches);
    }

    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Standings
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Rankings based on completed matches.
          </p>
        </div>

        <StandingsTable
          rows={standings}
          showOverallRank
          showBodyCount={shouldUseBodyCount}
        />

        <p className="text-xs text-gray-400 dark:text-slate-500">
          {tournamentType === "round_robin_classic"
            ? "Points follow classic scoring rules, including body count bonus."
            : "Points: Win = 3 · Draw = 1 · Loss = 0."}{" "}
          Tiebreakers: GD, then GF.
        </p>
      </section>
    );
  }

  if (tournamentType === "group_and_bracket" || tournamentType === "groupandbracket") {
    const qualifiersPerGroup = formatConfig?.qualifiersPerGroup ?? 2;
    const wildCardCount = formatConfig?.wildCardCount ?? 0;

    const { grouped, wildcardRows } = computeGroupedStandings(
      teams,
      matches,
      qualifiersPerGroup,
      wildCardCount,
      { useBodyCount: shouldUseBodyCount }
    );

    const wildCardIds = new Set(wildcardRows.map((row) => row.teamId));

    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Standings
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Teams are ranked inside each group, with overall ranking shown for cross-group comparison.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            Top {qualifiersPerGroup} in each group qualify
          </span>

          {wildCardCount > 0 && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
              {wildCardCount} wildcard{wildCardCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {Object.entries(grouped).map(([group, rows]) => (
          <div key={group} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Group {group}
              </h3>
              <span className="text-xs text-gray-400 dark:text-slate-500">
                {rows.length} teams
              </span>
            </div>

            <StandingsTable
              rows={rows}
              showGroupRank
              showOverallRank
              qualifiersPerGroup={qualifiersPerGroup}
              wildCardIds={wildCardIds}
              showBodyCount={shouldUseBodyCount}
            />
          </div>
        ))}

        <p className="text-xs text-gray-400 dark:text-slate-500">
          Points: Win = 3 · Draw = 1 · Loss = 0. Tiebreakers: GD, then GF.
        </p>
      </section>
    );
  }

  return null;
}

export default PublicStandingsTable;