export type MatchResult = "W" | "D" | "L";

type Props = {
  result: MatchResult;
};

export function ResultBadge({ result }: Props) {
  const styles: Record<MatchResult, string> = {
    W: "bg-green-500/10 text-green-500 dark:text-green-400",
    D: "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
    L: "bg-red-500/10 text-red-500 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${styles[result]}`}
    >
      {result}
    </span>
  );
}