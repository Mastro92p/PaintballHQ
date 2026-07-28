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
      <section className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900">
        {league.logoUrl && (
          <img
            src={league.logoUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-30 dark:opacity-25"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/75 to-white dark:from-gray-900/20 dark:via-gray-900/75 dark:to-gray-900" />

        <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-8 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white [text-shadow:0_1px_2px_rgba(255,255,255,0.6)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
              {league.name}
            </h1>
          </div>

          {league.description && (
            <p className="max-w-2xl text-sm text-gray-700 dark:text-gray-300 [text-shadow:0_1px_2px_rgba(255,255,255,0.6)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
              {league.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300 [text-shadow:0_1px_2px_rgba(255,255,255,0.6)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
            <span>🏆 {league.tournaments.length} tournaments</span>
            <span>👥 {league.teams.length} teams</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 sm:inline-flex sm:w-fit sm:flex-row">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all sm:justify-start sm:px-4 ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                  activeTab === tab.key
                    ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
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