import { Match } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type MatchCardProps = {
  match: Match;
};

type BadgeVariant = "default" | "success" | "warning" | "error" | "muted";

function scoreVariant(
  sA: number | null | undefined,
  sB: number | null | undefined,
  side: "a" | "b"
): BadgeVariant {
  if (sA == null || sB == null) return "muted";
  if (side === "a") return sA > sB ? "success" : sA < sB ? "error" : "default";
  return sB > sA ? "success" : sB < sA ? "error" : "default";
}

export function MatchCard({ match }: MatchCardProps) {
  const tA = match.teamA?.name ?? `Team ${match.teamAId}`;
  const tB = match.teamB?.name ?? `Team ${match.teamBId}`;
  const isPending = match.status === "pending";

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl p-4",
        "border border-gray-200 dark:border-gray-700"
      )}
    >
      {/* Round + field */}
      {(match.round || match.field) && (
        <div className="flex items-center gap-2 mb-2">
          {match.round && (
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              Round {match.round}
            </span>
          )}
          {match.field && (
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              · {match.field}
            </span>
          )}
        </div>
      )}

      {/* Teams + scores */}
      <div className="flex items-center gap-3">
        {/* Team A */}
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {tA}
        </span>

        {/* Scores */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isPending ? (
            <span className="text-xs text-gray-400 px-2">vs</span>
          ) : (
            <>
              <Badge variant={scoreVariant(match.scoreA, match.scoreB, "a")}>
                {match.scoreA ?? "—"}
              </Badge>
              <span className="text-gray-300 dark:text-gray-600 text-xs">:</span>
              <Badge variant={scoreVariant(match.scoreA, match.scoreB, "b")}>
                {match.scoreB ?? "—"}
              </Badge>
            </>
          )}
        </div>

        {/* Team B */}
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate text-right">
          {tB}
        </span>
      </div>

      {/* Status pill */}
      <div className="mt-2 flex justify-center">
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          isPending
            ? "bg-gray-100 text-gray-400 dark:bg-gray-800"
            : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
        )}>
          {isPending ? "Pending" : "Completed"}
        </span>
      </div>
    </div>
  );
}