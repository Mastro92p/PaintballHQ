"use client";

type DivFilter = number | "all";

type DivisionPillsProps = {
  divisions: { id: number; name: string }[];
  value: DivFilter;
  onChange: (value: DivFilter) => void;
  allLabel?: string;
};

export default function DivisionPills({
  divisions,
  value,
  onChange,
  allLabel = "All divisions",
}: DivisionPillsProps) {
  if (!divisions.length) return null;

  const baseClass =
    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors";

  const getClassName = (active: boolean) =>
    active
      ? `${baseClass} bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900`
      : `${baseClass} bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700`;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={getClassName(value === "all")}
      >
        {allLabel}
      </button>

      {divisions.map((division) => (
        <button
          key={division.id}
          type="button"
          onClick={() => onChange(division.id)}
          className={getClassName(value === division.id)}
        >
          {division.name}
        </button>
      ))}
    </div>
  );
}

export type { DivFilter };