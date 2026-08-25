import { StatCard } from "@/components/ui/StatCard";
import { ResultBadge, type MatchResult } from "@/components/ui/ResultBadge";
import type { TeamWithStats } from "@/types";

type Props = {
  team: TeamWithStats;
};

export function TeamHistoryModalContent({ team }: Props) {
const allMatches = [
  ...(team.matchesA ?? []).map((m) => ({
    ...m,
    opponent: m.teamB,
    myScore: m.scoreA,
    oppScore: m.scoreB,
    tournamentName: m.tournament?.name ?? "—",
  })),
  ...(team.matchesB ?? []).map((m) => ({
    ...m,
    opponent: m.teamA,
    myScore: m.scoreB,
    oppScore: m.scoreA,
    tournamentName: m.tournament?.name ?? "—",
  })),
]
  .filter((m) => m.status === "completed")
  .sort((matchA, matchB) => {
    const creationTimeA = Date.parse(matchA.createdAt);
    const creationTimeB = Date.parse(matchB.createdAt);

    return creationTimeB - creationTimeA;
  });

  const played = allMatches.length;
  const won = allMatches.filter((m) => (m.myScore ?? 0) > (m.oppScore ?? 0)).length;
  const drawn = allMatches.filter((m) => m.myScore === m.oppScore).length;
  const lost = allMatches.filter((m) => (m.myScore ?? 0) < (m.oppScore ?? 0)).length;
  const winRate = played === 0 ? 0 : Math.round((won / played) * 100);

  function getResult(m: (typeof allMatches)[0]): MatchResult {
    if (m.myScore === null || m.oppScore === null) return "D";
    if (m.myScore > m.oppScore) return "W";
    if (m.myScore < m.oppScore) return "L";
    return "D";
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <StatCard label="Played" value={played} />
        <StatCard label="Won" value={won} color="text-green-500 dark:text-green-400" />
        <StatCard label="Drawn" value={drawn} color="text-gray-400 dark:text-gray-500" />
        <StatCard label="Lost" value={lost} color="text-red-500 dark:text-red-400" />
        <StatCard label="Win Rate" value={winRate} color="text-teal-500 dark:text-teal-400" />
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
          Match History
        </h3>

        {allMatches.length === 0 ? (
          <p className="text-sm text-center py-8 text-gray-400 dark:text-gray-500">
            No completed matches yet
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 uppercase text-xs tracking-widest">
                <tr>
                  <th className="px-4 py-2.5 text-left">Tournament</th>
                  <th className="px-4 py-2.5 text-left">Round</th>
                  <th className="px-4 py-2.5 text-left">Opponent</th>
                  <th className="px-4 py-2.5 text-left">Score</th>
                  <th className="px-4 py-2.5 text-left">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {allMatches.map((m) => (
                  <tr key={m.id} className="bg-white dark:bg-gray-900">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {m.tournamentName}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 tabular-nums">
                      R{m.round ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      {m.opponent?.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-gray-700 dark:text-gray-300">
                      {m.myScore}–{m.oppScore}
                    </td>
                    <td className="px-4 py-3">
                      <ResultBadge result={getResult(m)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}