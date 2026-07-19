"use client";

import { Button } from "@/components/ui/Button";

type ManageLeaguesHeaderProps = {
  onCreate: () => void;
};

export function ManageLeaguesHeader({ onCreate }: ManageLeaguesHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Leagues
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create and manage leagues
        </p>
      </div>

      <Button
        onClick={onCreate}
        className="self-start sm:self-auto whitespace-nowrap px-4 py-2"
      >
        + New League
      </Button>
    </div>
  );
}