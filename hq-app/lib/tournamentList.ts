import { calcStandings } from "@/lib/utils";
import type { Tournament } from "@/types";

export type TournamentWithDetails = Tournament & {
  teams?: any[];
  matches?: any[];
  _teamCount?: number;
  _playedCount?: number;
};

export function formatTournamentDateBlock(dateStr: string) {
  const d = new Date(dateStr);

  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate(),
    year: d.getFullYear(),
  };
}

export function truncateText(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function getTournamentLeader(tournament: TournamentWithDetails): string {
  if (!tournament.matches || tournament.matches.length === 0) return "—";

  const enrolledTeamIds = tournament.teams?.map((t: any) => t.teamId) ?? [];
  const teamMap: Record<number, string> = {};

  tournament.teams?.forEach((t: any) => {
    if (t.team?.name) teamMap[t.teamId] = t.team.name;
  });

  const standings = calcStandings(tournament.matches, teamMap, enrolledTeamIds);
  return standings[0]?.teamName ?? "—";
}

export function getTournamentTeamCount(tournament: TournamentWithDetails) {
  return tournament.teams?.length ?? tournament._teamCount ?? 0;
}

export function getTournamentPlayedCount(tournament: TournamentWithDetails) {
  return (
    tournament.matches?.filter((m: any) => m.status === "completed").length ??
    tournament._playedCount ??
    0
  );
}