type StandingRow = {
  teamId: number;
  teamName: string;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  bodyCount: number;
};

type Props = {
  rows: StandingRow[];
  isClassic: boolean;
};

export function GroupStandingsTable({ rows, isClassic }: Props) {
  return (
    <div className="rounded-xl border border-[#22314d] bg-[#0f1b34] overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-white/5 text-gray-400 uppercase tracking-wide">
          <tr>
            <th className="px-3 py-3 text-left w-6">#</th>
            <th className="px-3 py-3 text-left">Team</th>
            <th className="px-3 py-3 text-center w-8">P</th>
            <th className="px-3 py-3 text-center w-8">W</th>
            <th className="px-3 py-3 text-center w-8">D</th>
            <th className="px-3 py-3 text-center w-8">L</th>
            <th className="px-3 py-3 text-center w-10">GF</th>
            <th className="px-3 py-3 text-center w-10">GA</th>
            <th className="px-3 py-3 text-center w-12">GD</th>
            {isClassic && (
              <th className="px-3 py-3 text-center w-14">Bodies</th>
            )}
            <th className="px-3 py-3 text-center w-10 font-bold text-amber-400">Pts</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#22314d]">
          {rows.map((row, idx) => {
            const played = row.w + row.d + row.l;

            return (
              <tr
                key={row.teamId}
                className={`bg-transparent ${idx === 0 ? "border-l-2 border-l-teal-400" : ""}`}
              >
                <td className="px-3 py-3 text-gray-400 tabular-nums">{idx + 1}</td>
                <td className="px-3 py-3 font-medium text-gray-100">{row.teamName}</td>
                <td className="px-3 py-3 text-center tabular-nums text-gray-300">{played}</td>
                <td className="px-3 py-3 text-center tabular-nums font-semibold text-emerald-400">
                  {row.w}
                </td>
                <td className="px-3 py-3 text-center tabular-nums text-gray-300">{row.d}</td>
                <td className="px-3 py-3 text-center tabular-nums font-semibold text-rose-400">
                  {row.l}
                </td>
                <td className="px-3 py-3 text-center tabular-nums text-gray-300">{row.gf}</td>
                <td className="px-3 py-3 text-center tabular-nums text-gray-300">{row.ga}</td>
                <td className="px-3 py-3 text-center tabular-nums text-gray-400">
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                {isClassic && (
                  <td className="px-3 py-3 text-center tabular-nums text-gray-400">
                    {row.bodyCount}
                  </td>
                )}
                <td className="px-3 py-3 text-center tabular-nums font-bold text-amber-400">
                  {row.pts}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export type { StandingRow };