"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  getTournamentStatusBadgeVariant,
  getTournamentStatusLabel,
} from "@/lib/tournamentStatusStyles";
import type { Tournament } from "@/types";
import { formatTournamentType } from "@/lib/tournamentType";

type TournamentsTableProps = {
  tournaments: Tournament[];
  deleting: number | null;
  onEdit: (tournament: Tournament) => void;
  onDelete: (id: number) => void;
};

export function TournamentsTable({
  tournaments,
  deleting,
  onEdit,
  onDelete,
}: TournamentsTableProps) {
  if (tournaments.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-10 text-center text-gray-400">
        No tournaments found
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-2 sm:hidden">
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {t.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {formatDate(t.date)}
                  {t.location ? ` · ${t.location}` : ""}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">
                  {t.division?.name ?? "—"} · <span className="capitalize">{formatTournamentType(t.type)}</span>
                </p>
              </div>

              <Badge variant={getTournamentStatusBadgeVariant(t.status)} className="shrink-0">
                {getTournamentStatusLabel(t.status)}
              </Badge>
            </div>

            <div className="mt-3 flex gap-2">
              <Link href={`/manage/tournaments/${t.id}`} className="flex-1">
                <Button variant="primary" size="sm" className="w-full whitespace-nowrap">
                  Manage →
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="flex-1 whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => onEdit(t)}
              >
                Edit
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 px-3 border border-rose-500/30 text-rose-500 dark:text-rose-400"
                loading={deleting === t.id}
                onClick={() => onDelete(t.id)}
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
              <th className="px-4 py-3 text-left">Date</th>
              <th className="hidden lg:table-cell px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Division</th>
              <th className="hidden lg:table-cell px-4 py-3 text-left">Format</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {tournaments.map((t) => (
              <tr
                key={t.id}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {t.name}
                </td>

                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {formatDate(t.date)}
                </td>

                <td className="hidden lg:table-cell px-4 py-3 text-gray-500 dark:text-gray-400">
                  {t.location ?? "—"}
                </td>

                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {t.division?.name ?? "—"}
                </td>

                <td className="hidden lg:table-cell px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">
                  {formatTournamentType(t.type)}
                </td>

                <td className="px-4 py-3">
                  <Badge variant={getTournamentStatusBadgeVariant(t.status)}>
                    {getTournamentStatusLabel(t.status)}
                  </Badge>
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/manage/tournaments/${t.id}`}>
                      <Button variant="primary" size="sm" className="whitespace-nowrap">
                        Manage →
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => onEdit(t)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="whitespace-nowrap border border-rose-500/30 text-rose-500 dark:text-rose-400"
                      loading={deleting === t.id}
                      onClick={() => onDelete(t.id)}
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