"use client";

type TabItem<T extends string> = {
  key: T;
  label: string;
  count?: number;
};

type TabSelectorProps<T extends string> = {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
};

export function TabSelector<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabSelectorProps<T>) {
  return (
    <div
      className={`flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 w-fit ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              isActive
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <span>{tab.label}</span>

            {tab.count !== undefined && (
              <span
                className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}