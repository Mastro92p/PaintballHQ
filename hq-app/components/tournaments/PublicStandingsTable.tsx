import { computeGroupedStandings, computeRoundRobinStandings, StandingRow, TournamentTeam,} from "@/lib/standings";
import { Match } from "@/types";
import { getClassicMatchResult } from "@/lib/utils";


type TournamentType = "round_robin" | "round_robin_classic" | "group_and_bracket" | "groupandbracket" | "single_elimination";


type FormatConfig = {
  qualifiersPerGroup?: number;
  wildCardCount?: number;
};


type Props = {
  tournamentType: TournamentType | string;
  teams: TournamentTeam[];
  matches: Match[];
  formatConfig?: FormatConfig | null;
};


function getRowClassName(
  row: StandingRow,
  qualifiersPerGroup: number,
  wildCardIds: Set<number>
) {
  if ((row.groupRank ?? 999) <= qualifiersPerGroup) {
    return "bg-emerald-500/10";
  }


  if (wildCardIds.has(row.teamId)) {
    return "bg-amber-500/10";
  }


  return "";
}


function renderGoalDiff(value: number) {
  return value > 0 ? `+${value}` : value;
}


function applyClassicScoring(rows: StandingRow[], matches: Match[]): StandingRow[] {
  const overrides: Record<number, { wins: number; draws: number; losses: number; points: number }> = {};

  rows.forEach((row) => {
    overrides[row.teamId] = { wins: 0, draws: 0, losses: 0, points: 0 };
  });

  matches.forEach((match) => {
    const completed =
      match.status === "completed" &&
      match.teamAId != null &&
      match.teamBId != null &&
      match.scoreA != null &&
      match.scoreB != null;

    if (!completed) return;

    const aId = match.teamAId!;
    const bId = match.teamBId!;
    if (!overrides[aId] || !overrides[bId]) return;

    const result = getClassicMatchResult(
      match.scoreA ?? null,
      match.scoreB ?? null,
      match.bodyCountA ?? null,
      match.bodyCountB ?? null
    );

    overrides[aId].points += result.pointsA;
    overrides[bId].points += result.pointsB;

    if (result.winner === "A") {
      overrides[aId].wins += 1;
      overrides[bId].losses += 1;
    } else if (result.winner === "B") {
      overrides[bId].wins += 1;
      overrides[aId].losses += 1;
    } else {
      overrides[aId].draws += 1;
      overrides[bId].draws += 1;
    }
  });

  const merged = rows.map((row) => ({
    ...row,
    wins: overrides[row.teamId].wins,
    draws: overrides[row.teamId].draws,
    losses: overrides[row.teamId].losses,
    points: overrides[row.teamId].points,
  }));

  merged.sort(
    (x, y) =>
      y.points - x.points ||
      y.gd - x.gd ||
      y.gf - x.gf ||
      x.teamName.localeCompare(y.teamName)
  );

  merged.forEach((row, index) => {
    row.overallRank = index + 1;
  });

  return merged;
}


function StandingsTable({
  rows,
  showGroupRank = false,
  showOverallRank = true,
  qualifiersPerGroup = 0,
  wildCardIds = new Set<number>(),
}: {
  rows: StandingRow[];
  showGroupRank?: boolean;
  showOverallRank?: boolean;
  qualifiersPerGroup?: number;
  wildCardIds?: Set<number>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              {showOverallRank && (
                <th className="px-4 py-3 text-left font-medium">Rank</th>
              )}
              {showGroupRank && (
                <th className="px-4 py-3 text-left font-medium">Grp</th>
              )}
              <th className="px-4 py-3 text-left font-medium">Team</th>
              <th className="px-3 py-3 text-right font-medium">P</th>
              <th className="px-3 py-3 text-right font-medium text-emerald-400">W</th>
              <th className="px-3 py-3 text-right font-medium">D</th>
              <th className="px-3 py-3 text-right font-medium text-rose-400">L</th>
              <th className="px-3 py-3 text-right font-medium">GF</th>
              <th className="px-3 py-3 text-right font-medium">GA</th>
              <th className="px-3 py-3 text-right font-medium">GD</th>
              <th className="px-4 py-3 text-right font-medium">PTS</th>
            </tr>
          </thead>


          <tbody>
            {rows.map((row) => (
              <tr
                key={row.teamId}
                className={`border-t border-white/10 text-slate-200 ${getRowClassName(
                  row,
                  qualifiersPerGroup,
                  wildCardIds
                )}`}
              >
                {showOverallRank && (
                  <td className="px-4 py-3 text-slate-300">{row.overallRank}</td>
                )}


                {showGroupRank && (
                  <td className="px-4 py-3 text-slate-300">{row.groupRank}</td>
                )}


                <td className="px-4 py-3 font-medium text-white">{row.teamName}</td>
                <td className="px-3 py-3 text-right">{row.played}</td>
                <td className="px-3 py-3 text-right text-emerald-400">{row.wins}</td>
                <td className="px-3 py-3 text-right">{row.draws}</td>
                <td className="px-3 py-3 text-right text-rose-400">{row.losses}</td>
                <td className="px-3 py-3 text-right">{row.gf}</td>
                <td className="px-3 py-3 text-right">{row.ga}</td>
                <td className="px-3 py-3 text-right">{renderGoalDiff(row.gd)}</td>
                <td className="px-4 py-3 text-right font-semibold text-amber-300">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export function PublicStandingsTable({
  tournamentType,
  teams,
  matches,
  formatConfig,
}: Props) {
  if (tournamentType === "round_robin" || tournamentType === "round_robin_classic") {
    let standings = computeRoundRobinStandings(teams, matches);

    if (tournamentType === "round_robin_classic") {
      standings = applyClassicScoring(standings, matches);
    }


    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Standings</h2>
          <p className="mt-1 text-sm text-slate-400">
            Rankings based on completed matches.
          </p>
        </div>


        <StandingsTable rows={standings} showOverallRank />


        <p className="text-xs text-slate-500">
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
      wildCardCount
    );


    const wildCardIds = new Set(wildcardRows.map((row) => row.teamId));


    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Standings</h2>
          <p className="mt-1 text-sm text-slate-400">
            Teams are ranked inside each group, with overall ranking shown for cross-group comparison.
          </p>
        </div>


        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
            Top {qualifiersPerGroup} in each group qualify
          </span>


          {wildCardCount > 0 && (
            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-amber-300">
              {wildCardCount} wildcard{wildCardCount > 1 ? "s" : ""}
            </span>
          )}
        </div>


        {Object.entries(grouped).map(([group, rows]) => (
          <div key={group} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Group {group}</h3>
              <span className="text-xs text-slate-500">{rows.length} teams</span>
            </div>


            <StandingsTable
              rows={rows}
              showGroupRank
              showOverallRank
              qualifiersPerGroup={qualifiersPerGroup}
              wildCardIds={wildCardIds}
            />
          </div>
        ))}


        <p className="text-xs text-slate-500">
          Points: Win = 3 · Draw = 1 · Loss = 0. Tiebreakers: GD, then GF.
        </p>
      </section>
    );
  }


  return null;
}


export default PublicStandingsTable;