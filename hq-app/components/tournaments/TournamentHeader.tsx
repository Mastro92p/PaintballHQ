import type { TournamentDetail } from "@/types";
import { formatDate } from "@/lib/utils";

type TournamentHeaderProps = {
  tournament: TournamentDetail;
  theme?: "light" | "dark";
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  upcoming: "Upcoming",
  to_check: "To Check",
  completed: "Completed",
};

const STATUS_CLASSES: Record<
  string,
  {
    dark: string;
    light: string;
  }
> = {
  active: {
    dark: "inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-300 ring-1 ring-inset ring-green-400/20",
    light:
      "inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/20 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400",
  },
  upcoming: {
    dark: "inline-flex items-center rounded-full bg-orange-500/20 px-3 py-1 text-sm font-medium text-orange-300 ring-1 ring-inset ring-orange-400/20",
    light:
      "inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-900/20 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400",
  },
  to_check: {
    dark: "inline-flex items-center rounded-full bg-yellow-500/20 px-3 py-1 text-sm font-medium text-yellow-300 ring-1 ring-inset ring-yellow-400/20",
    light:
      "inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400",
  },
  completed: {
    dark: "inline-flex items-center rounded-full bg-slate-500/20 px-3 py-1 text-sm font-medium text-slate-300 ring-1 ring-inset ring-slate-400/20",
    light:
      "inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400",
  },
};

export function TournamentHeader({
  tournament,
  theme = "dark",
}: TournamentHeaderProps) {
  const isDark = theme === "dark";

  const titleClass = isDark
    ? "text-4xl font-extrabold tracking-tight text-white"
    : "text-2xl font-bold text-gray-900 dark:text-gray-100";

  const metaClass = isDark
    ? "flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300"
    : "text-sm text-gray-500 dark:text-gray-400";

  const statusClass = tournament.status
    ? isDark
      ? STATUS_CLASSES[tournament.status]?.dark ??
        "inline-flex items-center rounded-full bg-slate-500/20 px-3 py-1 text-sm font-medium text-slate-300 ring-1 ring-inset ring-slate-400/20"
      : STATUS_CLASSES[tournament.status]?.light ??
        "inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400"
    : "";

  const typeClass = isDark
    ? "inline-flex items-center rounded-full bg-slate-700/70 px-3 py-1 text-sm font-medium text-slate-200 ring-1 ring-inset ring-white/10 capitalize"
    : "inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 capitalize";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className={titleClass}>{tournament.name}</h1>

        {tournament.status && (
          <span className={statusClass}>
            {STATUS_LABELS[tournament.status] ?? tournament.status}
          </span>
        )}

        {tournament.type && (
          <span className={typeClass}>
            {tournament.type.replace(/_/g, " ")}
          </span>
        )}
      </div>

      <div className={metaClass}>
        {tournament.date && (
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>{formatDate(tournament.date)}</span>
          </div>
        )}

        {tournament.location && (
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>{tournament.location}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span>👥</span>
          <span>{tournament.teams.length} teams</span>
        </div>

        <div className="flex items-center gap-2">
          <span>🎮</span>
          <span>{tournament.matches.length} matches</span>
        </div>
      </div>
    </div>
  );
}