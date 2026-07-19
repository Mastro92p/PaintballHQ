import type { Team } from "@/types";
import { Button } from "@/components/ui/Button";

type Props = {
  title?: string;
  availableTeams: Team[];
  selectedTeams: Team[];
  pendingChanges: boolean;
  saving: boolean;
  helperText?: string | null;
  availableLabel?: string;
  selectedLabel?: string;
  emptyAvailableText?: string;
  emptySelectedText?: string;
  onAddTeam: (team: Team) => void;
  onRemoveTeam: (team: Team) => void;
  onAddAll: () => void;
  onRemoveAll: () => void;
  onReset: () => void;
  onSave: () => void;
};

export function TeamsTransferTab({
  title = "Team Enrollment",
  availableTeams,
  selectedTeams,
  pendingChanges,
  saving,
  helperText = null,
  availableLabel = "Available",
  selectedLabel = "Enrolled",
  emptyAvailableText = "All teams enrolled",
  emptySelectedText = "No teams enrolled",
  onAddTeam,
  onRemoveTeam,
  onAddAll,
  onRemoveAll,
  onReset,
  onSave,
}: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>

      {pendingChanges && (
        <div className="sticky top-4 z-10 flex items-center justify-between p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 text-sm">
          <span className="text-teal-700 dark:text-teal-400">Unsaved enrollment changes</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onReset}>
              Reset
            </Button>
            <Button size="sm" loading={saving} onClick={onSave}>
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {helperText && <p className="text-xs text-gray-400">{helperText}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 40px 1fr",
          gap: "0.75rem",
          alignItems: "start",
        }}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {availableLabel}
            </span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full px-2 py-0.5 tabular-nums">
              {availableTeams.length}
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            {availableTeams.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-xs text-gray-400 text-center px-4">
                {emptyAvailableText}
              </div>
            ) : (
              availableTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => onAddTeam(team)}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  {team.name}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center pt-8">
          <button
            onClick={onAddAll}
            disabled={availableTeams.length === 0}
            title="Enroll all"
            className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-teal-500 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            »
          </button>
          <button
            onClick={onRemoveAll}
            disabled={selectedTeams.length === 0}
            title="Remove all"
            className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-red-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            «
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {selectedLabel}
            </span>
            <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full px-2 py-0.5 tabular-nums font-semibold">
              {selectedTeams.length}
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            {selectedTeams.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-xs text-gray-400">
                {emptySelectedText}
              </div>
            ) : (
              selectedTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => onRemoveTeam(team)}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  {team.name}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}