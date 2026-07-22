export const TOURNAMENT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  upcoming: "Upcoming",
  to_check: "To Check",
  completed: "Completed",
};

export const TOURNAMENT_STATUS_BADGE_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "muted" | "toCheck"
> = {
  upcoming: "warning",
  active: "default",
  to_check: "toCheck",
  completed: "muted",
};

export const TOURNAMENT_STATUS_DOT_CLASS: Record<string, string> = {
  active: "bg-green-500",
  upcoming: "bg-orange-400",
  to_check: "bg-yellow-400",
  completed: "bg-gray-400",
};

export const TOURNAMENT_STATUS_TEXT_CLASS: Record<string, string> = {
  active: "text-green-600 dark:text-green-400",
  upcoming: "text-orange-500 dark:text-orange-400",
  to_check: "text-yellow-600 dark:text-yellow-400",
  completed: "text-gray-400 dark:text-gray-500",
};

export function getTournamentStatusLabel(status?: string | null) {
  if (!status) return "Unknown";
  return TOURNAMENT_STATUS_LABELS[status] ?? status;
}

export function getTournamentStatusBadgeVariant(status?: string | null) {
  if (!status) return "muted" as const;
  return TOURNAMENT_STATUS_BADGE_VARIANT[status] ?? "muted";
}

export function getTournamentStatusDotClass(status?: string | null) {
  if (!status) return "bg-gray-400";
  return TOURNAMENT_STATUS_DOT_CLASS[status] ?? "bg-gray-400";
}

export function getTournamentStatusTextClass(status?: string | null) {
  if (!status) return "text-gray-400 dark:text-gray-500";
  return (
    TOURNAMENT_STATUS_TEXT_CLASS[status] ?? "text-gray-400 dark:text-gray-500"
  );
}