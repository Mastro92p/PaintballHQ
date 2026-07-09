import { formatDate } from "@/lib/utils";
import type { FormatConfig } from "@/types";
import type { TournamentDetail } from "@/types";

type Props = {
  data: TournamentDetail;
};

export function InfoTab({ data }: Props) {
  const fc = data.formatConfig as FormatConfig | null;

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tournament Info</h2>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        <Row label="Name"     value={data.name} />
        <Row label="Date"     value={formatDate(data.date)} />
        <Row label="Location" value={data.location ?? "—"} />
        <Row label="Format"   value={(data.type ?? "round_robin").replace(/_/g, " ")} />
        <Row label="Status"   value={data.status} />
        {fc && (
          <>
            <Row label="Groups"             value={String(fc.groupCount)} />
            <Row label="Teams per group"    value={String(fc.teamsPerGroup ?? "—")} />
            <Row label="Qualifiers/group"   value={String(fc.qualifiersPerGroup ?? "—")} />
            <Row label="Bracket seeding"    value={fc.bracketSeedingRule ?? "—"} />
            <Row label="Total capacity"     value={`${(fc.groupCount ?? 0) * (fc.teamsPerGroup ?? 0)} teams`} />
            <Row label="Advancing"          value={`${(fc.groupCount ?? 0) * (fc.qualifiersPerGroup ?? 0)} teams`} />
          </>
        )}
        <Row label="Enrolled teams" value={`${data.teams.length} teams`} />
        <Row label="Total matches"  value={`${data.matches.length} matches`} />
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{value}</span>
    </div>
  );
}