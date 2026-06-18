import { Team } from "@/types";
import { Table } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";

type TeamTableProps = {
  teams: Team[];
};

export function TeamTable({ teams }: TeamTableProps) {
  return (
    <Table
      data={teams}
      keyExtractor={(t) => t.id}
      emptyMessage="No teams registered yet."
      columns={[
        {
          key: "name",
          header: "Team Name",
          render: (t) => (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {t.name}
            </span>
          ),
        },
        {
          key: "contact",
          header: "Contact",
          render: (t) => (
            <span className="text-gray-500 dark:text-gray-400">
              {t.contact ?? "—"}
            </span>
          ),
        },
        {
          key: "createdAt",
          header: "Registered",
          render: (t) => (
            <span className="text-gray-500 dark:text-gray-400">
              {formatDate(t.createdAt)}
            </span>
          ),
          className: "text-right",
        },
      ]}
    />
  );
}