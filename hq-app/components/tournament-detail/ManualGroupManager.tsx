import { useState } from "react";

type Props = {
  groups: string[];
  savingGroups: boolean;
  onAddGroup: (name: string) => void;
  onRenameGroup: (oldName: string, newName: string) => void;
  onDeleteGroup: (name: string) => void;
};

export function ManualGroupManager({
  groups,
  savingGroups,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
}: Props) {
  const [newGroupName, setNewGroupName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function submitAdd() {
    onAddGroup(newGroupName.trim());
    setNewGroupName("");
  }

  function submitRename(oldName: string) {
    onRenameGroup(oldName, renameValue.trim());
    setRenaming(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {groups.map((g) =>
        renaming === g ? (
          <div key={g} className="flex items-center gap-1">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder={g}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename(g);
                if (e.key === "Escape") setRenaming(null);
              }}
              className="px-2 py-1 rounded-md text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 w-32"
            />
            <button
              onClick={() => submitRename(g)}
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
            key={g}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {g}
            <button
              onClick={() => {
                setRenaming(g);
                setRenameValue(g);
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
                    `Delete group "${g}"? This will delete its matches and unassign its teams.`
                  )
                ) {
                  onDeleteGroup(g);
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
          placeholder="New group name (optional)"
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