"use client";

import type { Match, Team } from "@/types";
import { MatchCard } from "./MatchCard";
import { TeamFilterDropdown } from "@/components/ui/TeamFilterDropdown";

type FixturesSectionProps = {
  isRoundRobin: boolean;
  isClassic: boolean;
  bodyCountEnabled: boolean;
  activeTeams: Team[];
  teamFilter: number | "all";
  onTeamFilterChange: (value: number | "all") => void;
  roundKeys: number[];
  matchesByRound: Record<number, Match[]>;
  filteredMatches: Match[];
  getRoundHeading: (round: number, matches: Match[]) => string;
};

export function FixturesSection({
  isRoundRobin,
  isClassic,
  bodyCountEnabled,
  activeTeams,
  teamFilter,
  onTeamFilterChange,
  roundKeys,
  matchesByRound,
  filteredMatches,
  getRoundHeading,
}: FixturesSectionProps) {
  return (
    <>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-slate-400">
          Fixtures
        </h4>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-slate-400">Team</label>

          <TeamFilterDropdown
            teams={activeTeams}
            value={teamFilter}
            onChange={onTeamFilterChange}
          />

          {teamFilter !== "all" && (
            <button
              type="button"
              onClick={() => onTeamFilterChange("all")}
              className="rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 transition-colors hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {isRoundRobin ? (
        <div className="mt-4 space-y-6">
          {roundKeys.length > 0 ? (
            roundKeys.map((round) => (
              <div key={round} className="space-y-3">
                <h4 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-slate-400">
                  <span>{getRoundHeading(round, matchesByRound[round])}</span>
                  <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
                </h4>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {matchesByRound[round].map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isClassic={isClassic}
                      isRoundRobin={isRoundRobin}
                      bodyCountEnabled={bodyCountEnabled}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] px-4 py-6 text-sm text-gray-500 dark:text-slate-400">
              No fixtures match this filter.
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4">
          {filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                isClassic={isClassic}
                isRoundRobin={isRoundRobin}
                bodyCountEnabled={bodyCountEnabled}
              />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] px-4 py-6 text-sm text-gray-500 dark:text-slate-400">
              No matches scheduled for this group yet.
            </div>
          )}
        </div>
      )}
    </>
  );
}