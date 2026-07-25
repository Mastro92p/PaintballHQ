import type { Tournament, FormatConfig } from "@/types";
import type { TournamentFormState } from "@/components/tournaments/TournamentFormModal";

export const STATUS_OPTIONS = ["upcoming", "active", "completed", "to_check"] as const;

export const TYPE_OPTIONS = [
  { value: "round_robin", label: "Round Robin" },
  { value: "round_robin_classic", label: "Round Robin Classic" },
  { value: "bracket", label: "Bracket (Knockout)" },
  { value: "group_and_bracket", label: "Group Stage + Bracket" },
] as const;

export const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  upcoming: "Upcoming",
  active: "Active",
  completed: "Completed",
  to_check: "To check",
};

export const STATUS_VARIANT: Record<
  (typeof STATUS_OPTIONS)[number],
  "default" | "success" | "warning" | "muted" | "toCheck"
> = {
  upcoming: "warning",
  active: "default",
  completed: "muted",
  to_check: "toCheck",
};

export const MANUAL_UNLIMITED = 9999;

export const EMPTY_TOURNAMENT_FORM: TournamentFormState = {
  name: "",
  date: "",
  location: "",
  status: "upcoming",
  type: "round_robin",
  divisionId: "",
  managementMode: "auto",
  groupCount: "2",
  teamsPerGroup: "4",
  qualifiersPerGroup: "2",
  wildCardCount: "2",
  bracketSeedingRule: "crossover",
  thirdPlaceMatch: false,
  isHidden: false
};

export type TournamentType = Tournament["type"];
export type TournamentStatus = Tournament["status"];
export type TournamentBracketSeedingRule = FormatConfig["bracketSeedingRule"];