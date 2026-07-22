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
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Location</th>
            <th className="px-4 py-3 text-left">Division</th>
            <th className="px-4 py-3 text-left">Format</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {tournaments.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                No tournaments found
              </td>
            </tr>
          ) : (
            tournaments.map((t) => (
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

                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {t.location ?? "—"}
                </td>

                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {t.division?.name ?? "—"}
                </td>

                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">
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
                      <Button variant="ghost" size="sm">
                        Manage →
                      </Button>
                    </Link>

                    <Button variant="ghost" size="sm" onClick={() => onEdit(t)}>
                      Edit
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      loading={deleting === t.id}
                      onClick={() => onDelete(t.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}