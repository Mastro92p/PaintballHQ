"use client";

export type StandingRow = {
  teamId: number;
  teamName: string;
  played: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  bodyCount: number;
};

type GroupStandingsTableProps = {
  rows: StandingRow[];
  showBodyCount: boolean;
};

export function GroupStandingsTable({
  rows,
  showBodyCount = false,
  
}: GroupStandingsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-8 text-center text-sm text-gray-400">
        No standings yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <tr>
            <th className="px-2 sm:px-4 py-3 text-left font-medium w-10">#</th>
            <th className="px-2 sm:px-4 py-3 text-left font-medium">Team</th>
            <th className="px-2 sm:px-4 py-3 text-center font-medium w-10 sm:w-auto">P</th>
            <th className="px-2 sm:px-4 py-3 text-center font-medium w-10 sm:w-auto">W</th>
            <th className="px-2 sm:px-4 py-3 text-center font-medium w-10 sm:w-auto">D</th>
            <th className="px-2 sm:px-4 py-3 text-center font-medium w-10 sm:w-auto">L</th>

            <th className="hidden sm:table-cell px-4 py-3 text-center font-medium">GF</th>
            <th className="hidden sm:table-cell px-4 py-3 text-center font-medium">GA</th>
            <th className="hidden sm:table-cell px-4 py-3 text-center font-medium">GD</th>

            {showBodyCount  && (
              <th className="hidden sm:table-cell px-4 py-3 text-center font-medium">
                BC
              </th>
            )}

            <th className="px-2 sm:px-4 py-3 text-center font-medium w-12 sm:w-auto">
              Pts
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, index) => (
            <tr key={row.teamId} className="text-gray-700 dark:text-gray-300">
              <td className="px-2 sm:px-4 py-3 tabular-nums text-gray-400 dark:text-gray-500">
                {index + 1}
              </td>

              <td className="px-2 sm:px-4 py-3 min-w-0">
                <div className="max-w-[120px] sm:max-w-none truncate font-medium text-gray-900 dark:text-gray-100">
                  {row.teamName}
                </div>
              </td>

              <td className="px-2 sm:px-4 py-3 text-center tabular-nums">
                {row.played}
              </td>
              <td className="px-2 sm:px-4 py-3 text-center tabular-nums">{row.w}</td>
              <td className="px-2 sm:px-4 py-3 text-center tabular-nums">{row.d}</td>
              <td className="px-2 sm:px-4 py-3 text-center tabular-nums">{row.l}</td>

              <td className="hidden sm:table-cell px-4 py-3 text-center tabular-nums">
                {row.gf}
              </td>
              <td className="hidden sm:table-cell px-4 py-3 text-center tabular-nums">
                {row.ga}
              </td>
              <td className="hidden sm:table-cell px-4 py-3 text-center tabular-nums">
                {row.gd > 0 ? `+${row.gd}` : row.gd}
              </td>

              {showBodyCount  && (
                <td className="hidden sm:table-cell px-4 py-3 text-center tabular-nums">
                  {row.bodyCount}
                </td>
              )}

              <td className="px-2 sm:px-4 py-3 text-center font-semibold tabular-nums text-teal-600 dark:text-teal-300">
                {row.pts}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}