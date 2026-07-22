export function formatTournamentType(type?: string | null) {
  return (type ?? "round_robin").replace(/_/g, " ");
}

export function formatTournamentTypeLabel(type?: string | null) {
  const formatted = formatTournamentType(type);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}