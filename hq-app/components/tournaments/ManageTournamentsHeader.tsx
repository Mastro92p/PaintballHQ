"use client";

import { Button } from "@/components/ui/Button";

type ManageTournamentsHeaderProps = {
  onCreate: () => void;
};

export function ManageTournamentsHeader({
  onCreate,
}: ManageTournamentsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Tournaments
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create and manage tournaments
        </p>
      </div>

      <Button
        onClick={onCreate}
        className="self-start whitespace-nowrap px-4 py-2 sm:self-auto"
      >
        + New Tournament
      </Button>
    </div>
  );
}