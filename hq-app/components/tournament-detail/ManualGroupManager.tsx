import { useState } from "react";
import type { TournamentGroup } from "@/types";


type Props = {
  groups: TournamentGroup[];
  savingGroups: boolean;
  onAddGroup: (name: string) => void;
  onRenameGroup: (groupId: number, newName: string) => void;
  onDeleteGroup: (groupId: number) => void;
};

export function ManualGroupManager({
  groups,
  savingGroups,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
}: Props) {
  const [newGroupName, setNewGroupName] = useState("");
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function submitAdd() {
    onAddGroup(newGroupName.trim());
    setNewGroupName("");
  }

  function submitRename(groupId: number) {
    onRenameGroup(groupId, renameValue.trim());
    setRenaming(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {groups.map((group) =>
        renaming === group.id ? (
          <div key={group.id} className="flex items-center gap-1">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder={group.name}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename(group.id);
                if (e.key === "Escape") setRenaming(null);
              }}
              className="px-2 py-1 rounded-md text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 w-32"
            />
            <button
              onClick={() => submitRename(group.id)}
              className="text-xs text-teal-600 hover:text-teal-700"
              title="Save"
            >
              ✓
            </button>
            <button
              onClick={() => setRenaming(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <span
            key={group.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {group.name}
            <button
              onClick={() => {
                setRenaming(group.id);
                setRenameValue(group.name);
              }}
              className="text-gray-400 hover:text-gray-600"
              title="Rename group"
            >
              ✎
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    `Delete group "${group.name}"? This will delete its matches and unassign its teams.`
                  )
                ) {
                  onDeleteGroup(group.id);
                }
              }}
              className="text-gray-400 hover:text-red-500"
              title="Delete group"
            >
              ×
            </button>
          </span>
        )
      )}

      <div className="flex items-center gap-1">
        <input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitAdd();
          }}
          placeholder="Group name (optional)"
          className="px-2 py-1.5 rounded-md text-sm border border-dashed border-gray-300 dark:border-gray-600 bg-transparent w-44"
          disabled={savingGroups}
        />
        <button
          onClick={submitAdd}
          disabled={savingGroups}
          className="text-sm text-teal-600 hover:text-teal-700 disabled:opacity-40"
        >
          + Add Group
        </button>
      </div>
    </div>
  );
}