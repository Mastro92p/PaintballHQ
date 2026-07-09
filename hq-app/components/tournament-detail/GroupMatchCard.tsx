import { Match } from "@/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export function GroupMatchCard({
  match: m,
  deleting,
  onEdit,
  onDelete,
}: {
  match: Match;
  deleting: boolean;
  onEdit: (m: Match) => void;
  onDelete: (id: number) => void;
}) {
  const aWins = m.status === "completed" && (m.scoreA ?? 0) > (m.scoreB ?? 0);
  const bWins = m.status === "completed" && (m.scoreB ?? 0) > (m.scoreA ?? 0);
  const draw = m.status === "completed" && m.scoreA === m.scoreB;

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={m.status === "completed" ? "muted" : "warning"}>
            {m.status}
          </Badge>
          {m.field && <span className="truncate">{m.field}</span>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onEdit(m)}
            className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(m.id)}
            disabled={deleting}
            className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="min-w-0">
          <div
            className={`truncate text-sm font-medium ${
              aWins
                ? "text-green-600 dark:text-green-400"
                : bWins
                ? "text-gray-400"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {m.teamA?.name ?? "TBD"}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {m.status === "completed" ? (
            <>
              {m.bodyCountA != null && (
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
                  {m.bodyCountA}
                </span>
              )}
              <span
                className={`min-w-[28px] h-7 px-2 rounded-md flex items-center justify-center text-xs font-bold tabular-nums text-white ${
                  aWins ? "bg-green-600" : draw ? "bg-gray-500" : "bg-red-500"
                }`}
              >
                {m.scoreA}
              </span>
              <span className="text-gray-400 text-xs">:</span>
              <span
                className={`min-w-[28px] h-7 px-2 rounded-md flex items-center justify-center text-xs font-bold tabular-nums text-white ${
                  bWins ? "bg-green-600" : draw ? "bg-gray-500" : "bg-red-500"
                }`}
              >
                {m.scoreB}
              </span>
              {m.bodyCountB != null && (
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
                  {m.bodyCountB}
                </span>
              )}
            </>
          ) : (
            <span className="px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              VS
            </span>
          )}
        </div>

        <div className="min-w-0 text-right">
          <div
            className={`truncate text-sm font-medium ${
              bWins
                ? "text-green-600 dark:text-green-400"
                : aWins
                ? "text-gray-400"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {m.teamB?.name ?? "TBD"}
          </div>
        </div>
      </div>
    </div>
  );
}