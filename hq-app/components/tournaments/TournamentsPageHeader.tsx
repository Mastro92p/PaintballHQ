"use client";

import { SearchInput } from "@/components/ui/SearchInput";

type TournamentsPageHeaderProps = {
  total: number;
  search: string;
  onSearchChange: (value: string) => void;
};

export function TournamentsPageHeader({
  total,
  search,
  onSearchChange,
}: TournamentsPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Tournaments
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {`${total} tournament${total !== 1 ? "s" : ""} total`}
        </p>
      </div>

      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search name or location..."
        className="sm:w-64"
      />
    </div>
  );
}