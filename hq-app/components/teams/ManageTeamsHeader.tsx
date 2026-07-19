"use client";

import { Button } from "@/components/ui/Button";

type ManageTeamsHeaderProps = {
  onCreate: () => void;
};

export function ManageTeamsHeader({ onCreate }: ManageTeamsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Teams
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create and manage teams
        </p>
      </div>

      <Button onClick={onCreate}>+ New Team</Button>
    </div>
  );
}