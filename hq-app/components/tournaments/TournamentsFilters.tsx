"use client";

import { DivisionFilterChips } from "@/components/ui/DivisionFilterChips";
import type { Division } from "@/types";

type TournamentsFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  divisionFilter: string;
  onDivisionFilterChange: (value: string) => void;
  divisions?: Division[] | null;
};

export function TournamentsFilters({
  search,
  onSearchChange,
  divisionFilter,
  onDivisionFilterChange,
  divisions,
}: TournamentsFiltersProps) {
  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Search tournaments..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full sm:max-w-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
      />

      <DivisionFilterChips
        divisions={divisions}
        value={divisionFilter}
        onChange={onDivisionFilterChange}
        includeAll
        includeUnassigned
        allLabel="All"
        highlightInactive
      />
    </div>
  );
}