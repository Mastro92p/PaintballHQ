"use client";

import type { Division } from "@/types";

type DivisionFilterValue = "all" | "unassigned" | string;

type DivisionOption = {
  id: number;
  name: string;
  isActive?: boolean | null;
};

type DivisionFilterChipsProps = {
  divisions?: DivisionOption[] | null;
  value: DivisionFilterValue;
  onChange: (value: DivisionFilterValue) => void;
  includeAll?: boolean;
  includeUnassigned?: boolean;
  allLabel?: string;
  highlightInactive?: boolean;
};

export function DivisionFilterChips({
  divisions,
  value,
  onChange,
  includeAll = true,
  includeUnassigned = true,
  allLabel = "All",
  highlightInactive = false,
}: DivisionFilterChipsProps) {
  const baseCls =
    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors";
  const activeCls = "bg-teal-700 text-white border-teal-700";
  const inactiveCls =
    "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800";

  const inactiveDivisionCls =
    "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/40";

  const inactiveDivisionActiveCls =
    "bg-orange-600 text-white border-orange-600 hover:bg-orange-700";

  return (
    <div className="flex flex-wrap gap-2">
      {includeAll && (
        <button
          type="button"
          onClick={() => onChange("all")}
          className={`${baseCls} ${value === "all" ? activeCls : inactiveCls}`}
        >
          {allLabel}
        </button>
      )}

      {divisions?.map((d) => {
        const isSelected = value === String(d.id);
        const isInactiveDivision = highlightInactive && d.isActive === false;

        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onChange(String(d.id))}
            title={isInactiveDivision ? "Inactive division" : undefined}
            className={`${baseCls} ${
              isSelected
                ? isInactiveDivision
                  ? inactiveDivisionActiveCls
                  : activeCls
                : isInactiveDivision
                ? inactiveDivisionCls
                : inactiveCls
            }`}
          >
            {d.name}
          </button>
        );
      })}

      {includeUnassigned && (
        <button
          type="button"
          onClick={() => onChange("unassigned")}
          className={`${baseCls} ${
            value === "unassigned" ? activeCls : inactiveCls
          }`}
        >
          Unassigned
        </button>
      )}
    </div>
  );
}