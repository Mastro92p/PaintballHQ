"use client";

type Tab = "tournaments" | "teams" | "manual-standings" | "info";

type LeaguePageHeaderProps = {
  league: {
    id: number;
    name: string;
    description?: string | null;
    logoUrl?: string | null;
    tournaments: unknown[];
    teams: unknown[];
  };
  activeTab: Tab;
  tabs: { key: Tab; label: string; count?: number }[];
  onTabChange: (tab: Tab) => void;
};

export function LeaguePageHeader({
  league,
  activeTab,
  tabs,
  onTabChange,
}: LeaguePageHeaderProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        {league.logoUrl && (
          <img
            src={league.logoUrl}
            alt={league.name}
            width={56}
            height={56}
            loading="lazy"
            className="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
        )}

        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {league.name}
          </h1>

          {league.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              {league.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

export default LeaguePageHeader;