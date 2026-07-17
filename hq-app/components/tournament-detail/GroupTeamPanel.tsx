import type { Team } from "@/types";

type Props = {
  groupId: number;
  groupName: string;
  capacity?: number;
  allTeams: Team[];
  managementMode: "auto" | "manual";
  teamGroups: Record<number, number[]>;
  assigningTeamId: number | null;
  onAssign: (teamId: number, groupId: number | null) => void;
};

export function GroupTeamPanel({
  groupId,
  groupName,
  capacity,
  allTeams,
  teamGroups,
  managementMode,
  assigningTeamId,
  onAssign,
}: Props) {
  const assigned = allTeams.filter((t) => (teamGroups[t.id] ?? []).includes(groupId));
  const availableToAdd = allTeams.filter(
    (t) => !(teamGroups[t.id] ?? []).includes(groupId)
  );
  const isFull =
    managementMode !== "manual" &&
    capacity != null &&
    assigned.length >= capacity;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#22314d] bg-gray-50 dark:bg-[#0f1b34] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Teams in {groupName}
        </span>
        {capacity != null && (
          <span
            className={`text-xs tabular-nums px-2 py-0.5 rounded-full ${
              isFull
                ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
            }`}
          >
            {managementMode === "manual" ? assigned.length : `${assigned.length}/${capacity}`}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {assigned.length === 0 ? (
          <span className="text-xs text-gray-400">No teams assigned yet</span>
        ) : (
          assigned.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/20"
            >
              {t.name}
              <button
                onClick={() => onAssign(t.id, groupId)}
                disabled={assigningTeamId === t.id}
                className="hover:text-red-500 transition-colors"
                title="Remove from group"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {!isFull && availableToAdd.length > 0 && (
        <select
          value=""
          disabled={assigningTeamId !== null}
          onChange={(e) => {
            const teamId = Number(e.target.value);
            if (teamId) onAssign(teamId, groupId);
          }}
          className="w-full sm:w-64 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#22314d] bg-white dark:bg-[#0a1428] text-sm text-gray-900 dark:text-gray-200"
        >
          <option value="">+ Add team to {groupName}...</option>
          {availableToAdd.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}