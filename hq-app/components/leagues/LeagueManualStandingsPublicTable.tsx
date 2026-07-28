"use client";

type PublicStandingDay = {
  id: number;
  label: string;
  date: string;
  tournament?: {
    id: number;
    name: string;
    date: string;
  } | null;
};

type PublicStandingCell = {
  dayId: number;
  savedScore: number | null;
  savedEventRank: number | null;
};

type PublicStandingRow = {
  team: {
    id: number;
    name: string;
    logoUrl?: string | null;
  };
  place: number | null;
  totalScore: number | null;
  cells: PublicStandingCell[];
};

type LeagueManualStandingsPublicTableProps = {
  divisionName: string;
  days: PublicStandingDay[];
  rows: PublicStandingRow[];
};

function formatDayLabel(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function formatRank(rank: number | null) {
  if (rank == null) return "—";
  if (rank % 100 >= 11 && rank % 100 <= 13) return `${rank}th`;
  if (rank % 10 === 1) return `${rank}st`;
  if (rank % 10 === 2) return `${rank}nd`;
  if (rank % 10 === 3) return `${rank}rd`;
  return `${rank}th`;
}

export default function LeagueManualStandingsPublicTable({
  divisionName,
  days,
  rows,
}: LeagueManualStandingsPublicTableProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {divisionName}
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Tournament-day points and total
          </p>
        </div>
      </div>

      {days.length === 0 ? (
        <div className="px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400">
          No tournament days found for this division.
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400">
          No league teams enrolled in this division.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead className="bg-slate-800 dark:bg-slate-900">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-800 dark:bg-slate-900 w-[160px] sm:w-[220px] px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                  Team
                </th>

                {days.map((day) => (
                  <th
                    key={day.id}
                    className="w-[110px] px-2 py-2 text-left text-[10px] font-semibold text-slate-300"
                  >
                    <div className="leading-tight min-w-0">
                      <div className="text-[11px] font-semibold text-slate-100 line-clamp-2 break-words">
                        {day.tournament?.name ?? day.label}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400 whitespace-nowrap">
                        {formatDayLabel(day.tournament?.date ?? day.date)}
                      </div>
                    </div>
                  </th>
                ))}

                <th className="w-[80px] px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row) => {
                const isGold = row.place === 1;
                const isSilver = row.place === 2;
                const isBronze = row.place === 3;

                const rowTone = isGold
                  ? "bg-amber-500/18 dark:bg-amber-500/17"
                  : isSilver
                  ? "bg-slate-300/18 dark:bg-slate-300/17"
                  : isBronze
                  ? "bg-orange-600/18 dark:bg-orange-600/18"
                  : "bg-white dark:bg-gray-900";

                const totalTone = isGold
                  ? "text-amber-700 dark:text-amber-300"
                  : isSilver
                  ? "text-slate-700 dark:text-slate-300"
                  : isBronze
                  ? "text-orange-700 dark:text-orange-300"
                  : "text-gray-900 dark:text-gray-100";


                const stickyTone = isGold
                  ? "bg-amber-500 dark:bg-yellow-700"
                  : isSilver
                  ? "bg-slate-500 dark:bg-slate-500"
                  : isBronze
                  ? "bg-orange-800 dark:bg-orange-800"
                  : "bg-white dark:bg-gray-900";

                return (
                  <tr
                    key={row.team.id}
                    className={`${rowTone} hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors`}
                  >
                    <td className={`sticky left-0 z-10 px-3 py-2.5 ${stickyTone}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {row.team.logoUrl ? (
                          <img
                            src={row.team.logoUrl}
                            alt={row.team.name}
                            width={24}
                            height={24}
                            loading="lazy"
                            className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0" />
                        )}

                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-gray-900 dark:text-gray-100 truncate">
                            {row.team.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {row.cells.map((cell, index) => (
                      <td
                        key={`${row.team.id}:${index}`}
                        className="px-2 py-2.5 text-[11px] text-gray-900 dark:text-gray-100"
                      >
                        {cell.savedScore == null && cell.savedEventRank == null ? (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        ) : (
                          <span className="tabular-nums whitespace-nowrap block">
                            <span className="font-semibold">
                              {cell.savedScore ?? "—"}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {" "}
                              ({formatRank(cell.savedEventRank)})
                            </span>
                          </span>
                        )}
                      </td>
                    ))}

                    <td className={`px-3 py-2.5 text-right text-[12px] font-semibold tabular-nums whitespace-nowrap ${totalTone}`}>
                      {row.totalScore == null ? "—" : row.totalScore.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}