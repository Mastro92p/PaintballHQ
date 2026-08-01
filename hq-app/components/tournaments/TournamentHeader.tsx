import type { TournamentDetail } from "@/types";
import { formatDate } from "@/lib/utils";

type TournamentHeaderProps = {
  tournament: TournamentDetail;
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  upcoming: "Upcoming",
  to_check: "To Check",
  completed: "Completed",
};

const STATUS_CLASSES: Record<string, string> = {
  active:
    "inline-flex items-center rounded-full bg-green-50 dark:bg-green-500/20 px-3 py-1 text-sm font-medium text-green-600 dark:text-green-300 ring-1 ring-inset ring-green-400/20",
  upcoming:
    "inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-500/20 px-3 py-1 text-sm font-medium text-orange-600 dark:text-orange-300 ring-1 ring-inset ring-orange-400/20",
  to_check:
    "inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-500/20 px-3 py-1 text-sm font-medium text-yellow-600 dark:text-yellow-300 ring-1 ring-inset ring-yellow-400/20",
  completed:
    "inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-500/20 px-3 py-1 text-sm font-medium text-gray-500 dark:text-slate-300 ring-1 ring-inset ring-slate-400/20",
};

export function TournamentHeader({ tournament }: TournamentHeaderProps) {
  const titleClass = "text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white";

  const metaClass =
    "flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-slate-300";

  const statusClass = tournament.status
    ? STATUS_CLASSES[tournament.status] ??
      "inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-500/20 px-3 py-1 text-sm font-medium text-gray-500 dark:text-slate-300 ring-1 ring-inset ring-slate-400/20"
    : "";

  const typeClass =
    "inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-700/70 px-3 py-1 text-sm font-medium text-gray-600 dark:text-slate-200 ring-1 ring-inset ring-gray-200 dark:ring-white/10 capitalize";

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
          <span className={typeClass}>{tournament.type.replace(/_/g, " ")}</span>
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