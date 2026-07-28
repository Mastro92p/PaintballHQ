"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { League } from "@/types";

type LeaguesTableProps = {
  leagues: League[];
  loading: boolean;
  error: string | null;
  deleting: number | null;
  onEdit: (league: League) => void;
  onDelete: (id: number) => void;
};

function LeagueLogo({ league }: { league: League }) {
  return league.logoUrl ? (
    <img
      src={league.logoUrl}
      alt={`${league.name} logo`}
      className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0"
    />
  ) : (
    <div className="h-10 w-10 rounded-lg border border-gray-700 bg-slate-800/80 flex flex-col items-center justify-center text-[9px] text-gray-400 shrink-0">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-3.5 w-3.5 mb-0.5 text-gray-500"
        aria-hidden="true"
      >
        <path d="M4 19V5" />
        <path d="M4 6c2-1 4-1 6 0s4 1 6 0 4-1 4 0v8c-2-1-4-1-6 0s-4 1-6 0-4-1-4 0" />
      </svg>
      <span>No logo</span>
    </div>
  );
}

export function LeaguesTable({
  leagues,
  loading,
  error,
  deleting,
  onEdit,
  onDelete,
}: LeaguesTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  if (leagues.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-10 text-center text-gray-400">
        No leagues found
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-2 sm:hidden">
        {leagues.map((league) => (
          <div
            key={league.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <LeagueLogo league={league} />

              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {league.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {league.description ?? "—"}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                  {league.tournaments?.length ?? 0} tournaments · {league.teams?.length ?? 0} teams
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Link href={`/manage/leagues/${league.id}`} className="flex-1">
                <Button variant="primary" size="sm" className="w-full whitespace-nowrap">
                  Manage →
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="flex-1 whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => onEdit(league)}
              >
                Edit
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 px-3 border border-rose-500/30 text-rose-500 dark:text-rose-400"
                loading={deleting === league.id}
                onClick={() => onDelete(league.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="hidden lg:table-cell px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Tournaments</th>
              <th className="px-4 py-3 text-left">Teams</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {leagues.map((league) => (
              <tr
                key={league.id}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <LeagueLogo league={league} />
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {league.name}
                    </span>
                  </div>
                </td>

                <td className="hidden lg:table-cell px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                  {league.description ?? "—"}
                </td>

                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 tabular-nums">
                  {league.tournaments?.length ?? 0}
                </td>

                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 tabular-nums">
                  {league.teams?.length ?? 0}
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/manage/leagues/${league.id}`}>
                      <Button variant="primary" size="sm" className="whitespace-nowrap">
                        Manage →
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => onEdit(league)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-rose-500/30 text-rose-500 dark:text-rose-400"
                      loading={deleting === league.id}
                      onClick={() => onDelete(league.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}