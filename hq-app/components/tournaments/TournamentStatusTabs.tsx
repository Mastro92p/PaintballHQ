"use client";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "to_check", label: "To Check" },
  { value: "completed", label: "Completed" },
] as const;

type Props = {
  value: string;
  counts: Record<string, number>;
  onChange: (value: string) => void;
};

export function TournamentStatusTabs({ value, counts, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full sm:w-fit">
      {STATUS_TABS.map((tab) => {
        const isActive = value === tab.value;
        const count = counts[tab.value] ?? 0;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`flex items-center justify-center gap-1 py-2 rounded-md text-sm font-medium transition-all duration-200 overflow-hidden
              sm:px-4 sm:flex-none sm:gap-1.5
              ${
                isActive
                  ? "flex-[3] px-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "flex-1 px-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
          >
            <span
              className={`whitespace-nowrap text-[13px] sm:text-sm ${
                isActive ? "inline" : "hidden sm:inline"
              }`}
            >
              {tab.label}
            </span>
            <span
              className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full shrink-0 ${
                isActive
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}