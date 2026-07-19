"use client";

import type { Division } from "@/types";

type DivisionFilterValue = "all" | "unassigned" | string;


type DivisionOption = {
  id: number;
  name: string;
};

type DivisionFilterChipsProps = {
  divisions?: DivisionOption[] | null;
  value: "all" | "unassigned" | string;
  onChange: (value: "all" | "unassigned" | string) => void;
  includeAll?: boolean;
  includeUnassigned?: boolean;
};

export function DivisionFilterChips({
  divisions,
  value,
  onChange,
  includeAll = true,
  includeUnassigned = true,
}: DivisionFilterChipsProps) {
  const baseCls =
    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors";
  const activeCls = "bg-teal-700 text-white border-teal-700";
  const inactiveCls =
    "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800";

  return (
    <div className="flex flex-wrap gap-2">
      {includeAll && (
        <button
          type="button"
          onClick={() => onChange("all")}
          className={`${baseCls} ${value === "all" ? activeCls : inactiveCls}`}
        >
          All
        </button>
      )}

      {divisions?.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onChange(String(d.id))}
          className={`${baseCls} ${value === String(d.id) ? activeCls : inactiveCls}`}
        >
          {d.name}
        </button>
      ))}

      {includeUnassigned && (
        <button
          type="button"
          onClick={() => onChange("unassigned")}
          className={`${baseCls} ${value === "unassigned" ? activeCls : inactiveCls}`}
        >
          Unassigned
        </button>
      )}
    </div>
  );
}