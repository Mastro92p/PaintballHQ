import { Badge } from "@/components/ui/Badge";
import {
  getTournamentStatusBadgeVariant,
  getTournamentStatusLabel,
} from "@/lib/tournamentStatusStyles";
import type { ReactNode } from "react";

type BaseRowProps = {
  label: string;
  children: ReactNode;
};

function BaseRow({ label, children }: BaseRowProps) {
  return (
    <div className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-center md:px-5">
      <div className="text-sm text-gray-500 dark:text-slate-400">{label}</div>
      <div className="text-sm font-medium text-gray-900 dark:text-white md:text-right">
        {children}
      </div>
    </div>
  );
}

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return <BaseRow label={label}>{value}</BaseRow>;
}

export function StatusRow({
  status,
  label = "Status",
}: {
  status?: string | null;
  label?: string;
}) {
  return (
    <BaseRow label={label}>
      <span className="inline-flex md:justify-end">
        <Badge variant={getTournamentStatusBadgeVariant(status)}>
          {getTournamentStatusLabel(status)}
        </Badge>
      </span>
    </BaseRow>
  );
}