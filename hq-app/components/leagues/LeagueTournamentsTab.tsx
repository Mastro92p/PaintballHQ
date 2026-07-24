"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  getTournamentStatusBadgeVariant,
  getTournamentStatusLabel,
} from "@/lib/tournamentStatusStyles";
import type { TournamentWithDivision } from "@/types";

type LeagueTournamentsTabProps = {
  tournaments: TournamentWithDivision[];
  detaching: number | null;
  onAssignClick: () => void;
  onDetach: (tournamentId: number) => void;
};

export function LeagueTournamentsTab({
  tournaments,
  detaching,
  onAssignClick,
  onDetach,
}: LeagueTournamentsTabProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Tournaments
        </h2>
        <Button size="sm" onClick={onAssignClick}>
          + Assign Tournament
        </Button>
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-gray-400 dark:border-gray-700">
          <p className="mb-2 text-2xl">🏆</p>
          <p className="font-medium">No tournaments yet</p>
          <p className="mt-1 text-sm">
            Assign existing tournaments or create new ones under this league
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Division</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Format</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tournaments.map((t) => (
                <tr
                  key={t.id}
                  className="bg-white transition-colors hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {t.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {t.division?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-500 dark:text-gray-400">
                    {(t.type ?? "round_robin").replace(/_/g, " ")}
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
                      <Button
                        variant="danger"
                        size="sm"
                        loading={detaching === t.id}
                        onClick={() => onDetach(t.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}