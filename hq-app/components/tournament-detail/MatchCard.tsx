import { Match } from "@/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

function MatchCard({
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
    <div className="px-4 py-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors space-y-2">
      <div className="flex items-center gap-2 sm:hidden">
        <span
          className={`flex-1 text-sm font-medium truncate ${
            aWins
              ? "text-green-500 font-bold"
              : bWins
              ? "text-gray-400"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {m.teamA?.name ?? "TBD"}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {m.status === "completed" ? (
            <>
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-xs font-bold tabular-nums ${
                  aWins ? "bg-green-600" : draw ? "bg-gray-500" : "bg-red-500"
                }`}
              >
                {m.scoreA}
              </span>
              <span className="text-gray-400 text-xs">·</span>
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-xs font-bold tabular-nums ${
                  bWins ? "bg-green-600" : draw ? "bg-gray-500" : "bg-red-500"
                }`}
              >
                {m.scoreB}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400 px-2">vs</span>
          )}
        </div>

        <span
          className={`flex-1 text-sm font-medium truncate text-right ${
            bWins
              ? "text-green-500 font-bold"
              : aWins
              ? "text-gray-400"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {m.teamB?.name ?? "TBD"}
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-3 py-1">
        <span
          className={`flex-1 text-base font-semibold truncate ${
            aWins
              ? "text-green-500 dark:text-green-400"
              : bWins
              ? "text-gray-400"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {m.teamA?.name ?? "TBD"}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {m.status === "completed" ? (
            <>
              <span
                className={`w-12 h-12 flex items-center justify-center rounded-full text-white text-xl font-bold tabular-nums ${
                  aWins ? "bg-green-600" : draw ? "bg-gray-500" : "bg-red-500"
                }`}
              >
                {m.scoreA}
              </span>
              <span className="text-gray-400 text-xl">·</span>
              <span
                className={`w-12 h-12 flex items-center justify-center rounded-full text-white text-xl font-bold tabular-nums ${
                  bWins ? "bg-green-600" : draw ? "bg-gray-500" : "bg-red-500"
                }`}
              >
                {m.scoreB}
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-gray-400 px-4">VS</span>
          )}
        </div>

        <span
          className={`flex-1 text-base font-semibold truncate text-right ${
            bWins
              ? "text-green-500 dark:text-green-400"
              : aWins
              ? "text-gray-400"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {m.teamB?.name ?? "TBD"}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={m.status === "completed" ? "muted" : "warning"}>
            {m.status}
          </Badge>
          {m.field && <span className="text-xs text-gray-400">{m.field}</span>}
          {m.group && <span className="text-xs text-gray-400">Group {m.groupId}</span>}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(m)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            loading={deleting}
            onClick={() => onDelete(m.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}