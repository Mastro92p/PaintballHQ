"use client";

type TournamentFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
};

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
];

export function TournamentFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: TournamentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <input
        type="search"
        placeholder="Search tournaments..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
      />

      {/* Status filter */}
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === opt.value
                ? "bg-teal-700 text-white"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}