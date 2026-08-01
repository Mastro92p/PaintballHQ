"use client";

import { formatDate } from "@/lib/utils";
import { InfoRow, StatusRow } from "@/components/tournaments/TournamentInfoRows";
import type { Tournament, Match, Team } from "@/types";

type EnrolledTeam = {
  teamId: number;
  team: Team;
};

type TournamentDetail = Tournament & {
  teams: EnrolledTeam[];
  matches: Match[];
};

type Props = {
  tournament: TournamentDetail;
};

function formatTournamentType(type?: string | null) {
  switch (type) {
    case "round_robin":
      return "Round Robin";
    case "group_and_bracket":
      return "Group And Bracket";
    case "single_elimination":
      return "Single Elimination";
    default:
      return type ? type.replaceAll("_", " ") : "—";
  }
}

function formatSeedingRule(rule?: string | null) {
  if (!rule) return "—";
  return rule
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PublicTournamentInfo({ tournament }: Props) {
  const formatConfig = (tournament.formatConfig ?? {}) as {
    groupCount?: number;
    teamsPerGroup?: number;
    qualifiersPerGroup?: number;
    wildCardCount?: number;
    bracketSeedingRule?: string;
    totalCapacity?: number;
  };

  const enrolledTeamsCount = tournament.teams?.length ?? 0;
  const totalMatchesCount = tournament.matches?.length ?? 0;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tournament Info
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          General details, format settings, and participation numbers.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900/60">
        <div className="divide-y divide-gray-200 dark:divide-white/10">
          <InfoRow label="Name" value={tournament.name ?? "—"} />
          <InfoRow
            label="Date"
            value={tournament.date ? formatDate(tournament.date) : "—"}
          />
          <InfoRow label="Location" value={tournament.location ?? "—"} />
          <InfoRow
            label="Format"
            value={formatTournamentType(tournament.type)}
          />
          <StatusRow status={tournament.status} />

          {tournament.type === "group_and_bracket" && (
            <>
              <InfoRow label="Groups" value={formatConfig.groupCount ?? "—"} />
              <InfoRow
                label="Teams per group"
                value={formatConfig.teamsPerGroup ?? "—"}
              />
              <InfoRow
                label="Qualifiers/group"
                value={formatConfig.qualifiersPerGroup ?? "—"}
              />
              <InfoRow
                label="Wild cards"
                value={formatConfig.wildCardCount ?? 0}
              />
              <InfoRow
                label="Bracket seeding"
                value={formatSeedingRule(formatConfig.bracketSeedingRule)}
              />
            </>
          )}

          <InfoRow
            label="Total capacity"
            value={`${formatConfig.totalCapacity ?? enrolledTeamsCount} Teams`}
          />
          <InfoRow
            label="Enrolled teams"
            value={`${enrolledTeamsCount} Teams`}
          />
          <InfoRow
            label="Total matches"
            value={`${totalMatchesCount} Matches`}
          />
        </div>
      </div>
    </section>
  );
}