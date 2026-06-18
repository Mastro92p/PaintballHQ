import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
  className?: string;
};

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data available.",
  className,
}: TableProps<T>) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700",
        className
      )}
    >
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs tracking-wide">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-3 text-left font-medium", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-gray-400 dark:text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-gray-800 dark:text-gray-200",
                      col.className
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}