type Props = {
  wins: number;
  total: number;
};

export function WinRateBar({ wins, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((wins / total) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="w-16 sm:w-40 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300 font-medium w-9">
        {pct}%
      </span>
    </div>
  );
}