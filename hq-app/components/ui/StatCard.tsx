type Props = {
  label: string;
  value: number;
  color?: string;
};

export function StatCard({ label, value, color }: Props) {
  return (
    <div className="flex flex-col gap-1 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 min-w-0">
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <span
        className={`text-2xl sm:text-3xl font-bold tabular-nums ${
          color ?? "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}