"use client";

export type StandingRow = {
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  bodyCount: number;
};

type StandingsTableProps = {
  rows: StandingRow[];
  isClassic: boolean;
  showBodyCount: boolean;
};

export function StandingsTable({ 
  rows, 
  showBodyCount, 

}: StandingsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="px-3 py-3 text-left font-medium">#</th>
              <th className="px-3 py-3 text-left font-medium">Team</th>
              <th className="px-3 py-3 text-right font-medium">P</th>
              <th className="px-3 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400/80">
                W
              </th>
              <th className="px-3 py-3 text-right font-medium">D</th>
              <th className="px-3 py-3 text-right font-medium text-red-600 dark:text-red-400/80">
                L
              </th>
              <th className="px-3 py-3 text-right font-medium">GF</th>
              <th className="px-3 py-3 text-right font-medium">GA</th>
              <th className="px-3 py-3 text-right font-medium">GD</th>
              {showBodyCount  && (
                <th className="px-3 py-3 text-right font-medium text-sky-600 dark:text-sky-400/80">
                  BC
                </th>
              )}
              <th className="px-3 py-3 text-right font-medium text-amber-600 dark:text-amber-400/80">
                PTS
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.teamId}
                className="border-t border-gray-200 text-gray-900 dark:border-white/10 dark:text-slate-200"
              >
                <td className="px-3 py-3 text-gray-500 dark:text-slate-400">{index + 1}</td>
                <td className="px-3 py-3 font-medium">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
                      {row.teamLogoUrl ? (
                        <img
                          src={row.teamLogoUrl}
                          alt={`${row.teamName} logo`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[8px] text-gray-400 dark:text-slate-500">—</span>
                      )}
                    </div>
                    <span>{row.teamName}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-slate-300">
                  {row.played}
                </td>
                <td className="px-3 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {row.wins}
                </td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-slate-300">
                  {row.draws}
                </td>
                <td className="px-3 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                  {row.losses}
                </td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-slate-300 tabular-nums">
                  {row.gf}
                </td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-slate-300 tabular-nums">
                  {row.ga}
                </td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-slate-300 tabular-nums">
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                {showBodyCount  && (
                  <td className="px-3 py-3 text-right text-sky-600 dark:text-sky-400 tabular-nums">
                    {row.bodyCount}
                  </td>
                )}
                <td className="px-3 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">
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