"use client";

import {
  formatTournamentDateBlock,
  getTournamentLeader,
  getTournamentPlayedCount,
  getTournamentTeamCount,
  truncateText,
  type TournamentWithDetails,
} from "@/lib/tournaments/tournamentList";
import {
  getTournamentStatusDotClass,
  getTournamentStatusLabel,
  getTournamentStatusTextClass,
} from "@/lib/tournaments/tournamentStatusStyles";

export function TournamentListItem({
  tournament,
  onClick,
}: {
  tournament: TournamentWithDetails;
  onClick: () => void;
}) {
  const { month, day, year } = formatTournamentDateBlock(tournament.date);
  const teamCount = getTournamentTeamCount(tournament);
  const playedCount = getTournamentPlayedCount(tournament);
  const leader = getTournamentLeader(tournament);

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden group"
    >
      <div className="flex flex-col items-center justify-center w-20 shrink-0 px-3 py-4 border-r border-gray-100 dark:border-gray-800 self-stretch">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none">
          {month}
        </span>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight tabular-nums">
          {day}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 leading-none">
          {year}
        </span>
      </div>

      <div className="flex-1 min-w-0 px-5 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">
            {tournament.name}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${getTournamentStatusTextClass(
              tournament.status
            )}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${getTournamentStatusDotClass(
                tournament.status
              )}`}
            />
            {getTournamentStatusLabel(tournament.status)}
          </span>

          {tournament.division?.name && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {tournament.division.name}
            </span>
          )}
        </div>

        {tournament.location && (
          <div className="hidden sm:flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {tournament.location}
          </div>
        )}

        <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
              {teamCount}
            </span>{" "}
            teams
          </span>

          <span className="text-gray-300 dark:text-gray-700">·</span>

          <span className="text-xs text-gray-400 dark:text-gray-500">
            <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
              {playedCount}
            </span>{" "}
            played
          </span>

          {leader !== "—" && (
            <>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <span className="text-xs flex items-center gap-1 text-gray-400 dark:text-gray-500">
                🏆{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {truncateText(leader, 14)}
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-8 px-6 py-4 border-l border-gray-100 dark:border-gray-800 shrink-0">
        <Stat label="Teams" value={teamCount} />
        <Stat label="Played" value={playedCount} />
        <Stat label="Leader" value={leader} />
      </div>

      <div className="pr-4 pl-2 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors shrink-0">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
        {label}
      </p>
      <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">
        {value}
      </p>
    </div>
  );
}