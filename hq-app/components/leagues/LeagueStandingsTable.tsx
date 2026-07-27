import type { StandingRow } from "@/lib/standings";

type Props = {
  standings: StandingRow[];
  showBodyCount?: boolean;
};

export default function LeagueStandingsTable({ standings, showBodyCount = false }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
          <tr>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-left w-8">#</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-left">Team</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">P</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center font-semibold text-green-600 dark:text-green-400">W</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">D</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center font-semibold text-red-500 dark:text-red-400">L</th>
            <th className="hidden sm:table-cell px-2 py-2 sm:px-4 sm:py-3 text-center">GF</th>
            <th className="hidden sm:table-cell px-2 py-2 sm:px-4 sm:py-3 text-center">GA</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">GD</th>
            {showBodyCount && (
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center font-semibold text-sky-500 dark:text-sky-400">BC</th>
            )}
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center font-bold text-orange-500 dark:text-orange-400">PTS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {standings.map((s, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            const rowBg =
              i === 0 ? "bg-amber-500/12 dark:bg-amber-500/12" :
              i === 1 ? "bg-slate-300/12 dark:bg-slate-300/12" :
              i === 2 ? "bg-orange-600/12 dark:bg-orange-600/12" :
              "bg-white dark:bg-gray-900";

            return (
              <tr key={s.teamId} className={`${rowBg} transition-colors`}>
                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center text-base leading-none">
                  {medal ?? <span className="text-sm tabular-nums text-gray-400">{i + 1}</span>}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[90px] sm:max-w-none truncate">
                  {s.teamName}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-gray-600 dark:text-gray-400">{s.played}</td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-green-600 dark:text-green-400 font-medium">{s.wins}</td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-gray-600 dark:text-gray-400">{s.draws}</td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-red-500 dark:text-red-400 font-medium">{s.losses}</td>
                <td className="hidden sm:table-cell px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-gray-600 dark:text-gray-400">{s.gf}</td>
                <td className="hidden sm:table-cell px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-gray-600 dark:text-gray-400">{s.ga}</td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-gray-600 dark:text-gray-400">
                  {s.gd > 0 ? `+${s.gd}` : s.gd}
                </td>
                {showBodyCount && (
                  <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums text-sky-500 dark:text-sky-400">
                    {s.bodyCount ?? 0}
                  </td>
                )}
                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center tabular-nums font-bold text-orange-500 dark:text-orange-400">
                  {s.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}