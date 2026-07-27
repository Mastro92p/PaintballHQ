"use client";

type GroupTabsProps = {
  groupTabs: string[];
  activeGroup: string;
  onSelect: (group: string) => void;
  teamsByGroup: Record<string, unknown[]>;
  matchCountByGroup: Record<string, number>;
};

export function GroupTabs({
  groupTabs,
  activeGroup,
  onSelect,
  teamsByGroup,
  matchCountByGroup,
}: GroupTabsProps) {
  return (
    <div className="w-fit rounded-xl bg-white/5 p-1">
      <div className="flex flex-wrap gap-1">
        {groupTabs.map((group) => {
          const isActive = activeGroup === group;
          const count = matchCountByGroup[group] ?? 0;
          const teamCount = teamsByGroup[group]?.length ?? 0;

          return (
            <button
              key={group}
              onClick={() => onSelect(group)}
              className={[
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <span>{group}</span>
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                  isActive
                    ? "bg-slate-100 text-slate-600"
                    : "bg-white/10 text-slate-400",
                ].join(" ")}
              >
                {teamCount}T / {count}M
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}