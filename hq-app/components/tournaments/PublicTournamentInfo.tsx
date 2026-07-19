"use client";

import { formatDate } from "@/lib/utils";
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

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  upcoming: "Upcoming",
  to_check: "To Check",
  completed: "Completed",
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

function formatStatus(status?: string | null) {
  if (!status) return "—";
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
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

  const rows: Array<{ label: string; value: string | number }> = [
    { label: "Name", value: tournament.name ?? "—" },
    { label: "Date", value: tournament.date ? formatDate(tournament.date) : "—" },
    { label: "Location", value: tournament.location ?? "—" },
    { label: "Format", value: formatTournamentType(tournament.type) },
    { label: "Status", value: formatStatus(tournament.status) },
  ];

  if (tournament.type === "group_and_bracket") {
    rows.push(
      { label: "Groups", value: formatConfig.groupCount ?? "—" },
      { label: "Teams per group", value: formatConfig.teamsPerGroup ?? "—" },
      { label: "Qualifiers/group", value: formatConfig.qualifiersPerGroup ?? "—" },
      { label: "Wild cards", value: formatConfig.wildCardCount ?? 0 },
      { label: "Bracket seeding", value: formatSeedingRule(formatConfig.bracketSeedingRule) },
    );
  }

  rows.push(
    { label: "Total capacity", value: `${formatConfig.totalCapacity ?? enrolledTeamsCount} Teams` },
    { label: "Enrolled teams", value: `${enrolledTeamsCount} Teams` },
    { label: "Total matches", value: `${totalMatchesCount} Matches` },
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Tournament Info</h2>
        <p className="mt-1 text-sm text-slate-400">
          General details, format settings, and participation numbers.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
        <div className="divide-y divide-white/10">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-center md:px-5"
            >
              <div className="text-sm text-slate-400">{row.label}</div>
              <div className="text-sm font-medium text-white md:text-right">
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}