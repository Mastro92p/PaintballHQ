import { formatDate } from "@/lib/utils";
import { InfoRow, StatusRow } from "@/components/tournaments/TournamentInfoRows";
import type { FormatConfig, TournamentDetail } from "@/types";

type Props = {
  data: TournamentDetail;
};

function formatTournamentType(type?: string | null) {
  switch (type) {
    case "round_robin":
      return "Round Robin";
    case "round_robin_classic":
      return "Round Robin Classic";
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

export function InfoTab({ data }: Props) {
  const formatConfig = (data.formatConfig ?? {}) as FormatConfig & {
    totalCapacity?: number;
  };

  const enrolledTeamsCount = data.teams?.length ?? 0;
  const totalMatchesCount = data.matches?.length ?? 0;

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
          <InfoRow label="Name" value={data.name ?? "—"} />
          <InfoRow label="Date" value={data.date ? formatDate(data.date) : "—"} />
          <InfoRow label="Location" value={data.location ?? "—"} />
          <InfoRow label="Division" value={data.division?.name ?? "Unassigned"} />
          <InfoRow label="Format" value={formatTournamentType(data.type)} />
          <StatusRow status={data.status} />

          {data.type === "group_and_bracket" && (
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