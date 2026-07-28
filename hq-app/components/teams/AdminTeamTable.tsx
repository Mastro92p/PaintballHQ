"use client";

import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import type { Team } from "@/types";

type AdminTeamTableProps = {
  teams: Team[];
  loading: boolean;
  error: string | null;
  deleting: number | null;
  onEdit: (team: Team) => void;
  onDelete: (id: number) => void;
};

export function AdminTeamTable({
  teams,
  loading,
  error,
  deleting,
  onEdit,
  onDelete,
}: AdminTeamTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  if (teams.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-10 text-center text-gray-400">
        No teams found
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-2 sm:hidden">
        {teams.map((team) => (
          <div
            key={team.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt={`${team.name} logo`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-[9px] text-gray-400 text-center leading-tight">
                    No logo
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {team.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {team.division?.name ?? "—"}
                  {team.contact ? ` · ${team.contact}` : ""}
                </p>
              </div>
            </div>

          <div className="mt-3 flex gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(team)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 border border-rose-500/30 text-rose-500 dark:text-rose-400"
              loading={deleting === team.id}
              onClick={() => onDelete(team.id)}
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
              <th className="px-4 py-3 text-left">Logo</th>
              <th className="px-4 py-3 text-left">Team Name</th>
              <th className="px-4 py-3 text-left">Division</th>
              <th className="hidden lg:table-cell px-4 py-3 text-left">Contact</th>
              <th className="hidden lg:table-cell px-4 py-3 text-left">Registered</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {teams.map((team) => (
              <tr
                key={team.id}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={`${team.name} logo`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[10px] text-gray-400 text-center leading-tight">
                        No logo
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {team.name}
                </td>

                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {team.division?.name ?? "—"}
                </td>

                <td className="hidden lg:table-cell px-4 py-3 text-gray-500 dark:text-gray-400">
                  {team.contact ?? "—"}
                </td>

                <td className="hidden lg:table-cell px-4 py-3 text-gray-500 dark:text-gray-400">
                  {formatDate(team.createdAt)}
                </td>

              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="primary" size="sm" onClick={() => onEdit(team)}>
                    Edit
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="border border-rose-500/30 text-rose-500 dark:text-rose-400"
                    loading={deleting === team.id}
                    onClick={() => onDelete(team.id)}
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