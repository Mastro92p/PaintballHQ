import Link from "next/link";
import { Tournament } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

type TournamentCardProps = {
  tournament: Tournament;
};

const statusVariant: Record<string, "default" | "success" | "warning" | "muted"> = {
  upcoming:  "warning",
  active:    "default",
  completed: "muted",
};

const statusLabel: Record<string, string> = {
  upcoming:  "Upcoming",
  active:    "Active",
  completed: "Completed",
};

export function TournamentCard({ tournament }: TournamentCardProps) {
  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className={cn(
        "block bg-white dark:bg-gray-900",
        "border border-gray-200 dark:border-gray-700 rounded-xl p-5",
        "hover:shadow-md transition-shadow group"
      )}
    >
      {/* Top row — name + status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors leading-snug">
          {tournament.name}
        </h3>
        <Badge variant={statusVariant[tournament.status] ?? "muted"}>
          {statusLabel[tournament.status] ?? tournament.status}
        </Badge>
      </div>

      {/* Meta */}
      <div className="space-y-1">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <span>📅</span>
          <span>{formatDate(tournament.date)}</span>
        </p>
        {tournament.location && (
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>📍</span>
            <span>{tournament.location}</span>
          </p>
        )}
        {tournament.teams && (
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>👥</span>
            <span>{tournament.teams.length} teams</span>
          </p>
        )}
      </div>
    </Link>
  );
}