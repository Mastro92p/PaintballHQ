import Link from "next/link";
import { prisma } from "@/lib/db";

const statusDot: Record<string, string> = {
  active: "bg-green-500",
  upcoming: "bg-orange-400",
  to_check: "bg-yellow-400",
  completed: "bg-gray-400 dark:bg-gray-500",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  upcoming: "Upcoming",
  to_check: "To Check",
  completed: "Completed",
};

const statusBadge: Record<string, string> = {
  active: "border-green-500/30 text-green-500 bg-green-500/10",
  upcoming: "border-orange-400/30 text-orange-400 bg-orange-400/10",
  to_check:
    "border-yellow-400/30 text-yellow-600 bg-yellow-400/10 dark:text-yellow-400",
  completed: "border-gray-400/30 text-gray-400 bg-gray-400/10",
};

export default async function DashboardPage() {
  const [
    allTournaments,
    recentTournaments,
    teamsCount,
    matchesPlayed,
    pendingMatches,
    recentMatches,
  ] = await Promise.all([
    prisma.tournament.findMany({
      where: {
        isHidden: false,
        OR: [
          { leagueId: null },
          {
            league: {
              is: {
                isHidden: false,
              },
            },
          },
        ],
      },
      orderBy: { date: "desc" },
    }),
    prisma.tournament.findMany({
      where: {
        isHidden: false,
        OR: [
          { leagueId: null },
          {
            league: {
              is: {
                isHidden: false,
              },
            },
          },
        ],
      },
      orderBy: { date: "desc" },
      take: 8,
    }),
    prisma.team.count(),
    prisma.match.count({
      where: {
        status: "completed",
        tournament: {
          isHidden: false,
          OR: [
            { leagueId: null },
            {
              league: {
                is: {
                  isHidden: false,
                },
              },
            },
          ],
        },
      },
    }),
    prisma.match.count({
      where: {
        status: "pending",
        tournament: {
          isHidden: false,
          OR: [
            { leagueId: null },
            {
              league: {
                is: {
                  isHidden: false,
                },
              },
            },
          ],
        },
      },
    }),
    prisma.match.findMany({
      where: {
        status: "completed",
        tournament: {
          isHidden: false,
          OR: [
            { leagueId: null },
            {
              league: {
                is: {
                  isHidden: false,
                },
              },
            },
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { teamA: true, teamB: true, tournament: true },
    }),
  ]);

  const activeCount = allTournaments.filter((t) => t.status === "active").length;
  const upcomingCount = allTournaments.filter((t) => t.status === "upcoming").length;
  const toCheckCount = allTournaments.filter((t) => t.status === "to_check").length;

  const kpis = [
    {
      label: "Tournaments",
      value: allTournaments.length,
      sub: `${activeCount} active${toCheckCount > 0 ? ` · ${toCheckCount} to check` : ""}`,
    },
    {
      label: "Teams",
      value: teamsCount,
      sub: "Across all tournaments",
    },
    {
      label: "Matches Played",
      value: matchesPlayed,
      sub: `${pendingMatches} pending`,
    },
    {
      label: "Upcoming",
      value: upcomingCount,
      sub: "tournaments scheduled",
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome back to PaintballHQ
        </p>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {k.label}
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {k.value}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {k.sub}
            </p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Tournaments
            </h2>
            <Link
              href="/tournaments"
              className="text-xs text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              View all
            </Link>
          </div>

          {recentTournaments.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              <p className="mb-2 text-2xl">🏆</p>
              <p className="text-sm font-medium">No tournaments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentTournaments.map((t) => (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}`}
                  className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-teal-600 dark:text-gray-100 dark:group-hover:text-teal-400">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t.date.slice(0, 10)}
                      {t.location && ` · ${t.location}`}
                    </p>
                  </div>

                  <div className="ml-4 flex shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                        statusBadge[t.status] ??
                        "border-gray-400/30 text-gray-400 bg-gray-400/10"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          statusDot[t.status] ?? "bg-gray-400"
                        }`}
                      />
                      {statusLabel[t.status] ?? t.status}
                    </span>

                    <svg
                      className="h-4 w-4 text-gray-300 transition-colors group-hover:text-teal-500 dark:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Recent Results
            </h2>
          </div>

          {recentMatches.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              <p className="mb-2 text-2xl">🎮</p>
              <p className="text-sm font-medium">No results yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentMatches.map((m) => {
                const isDraw = m.scoreA === m.scoreB;
                const aWon = (m.scoreA ?? 0) > (m.scoreB ?? 0);
                const teamAName = m.teamA?.name ?? "TBD";
                const teamBName = m.teamB?.name ?? "TBD";

                return (
                  <Link
                    key={m.id}
                    href={`/tournaments/${m.tournamentId}`}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <p className="w-36 shrink-0 truncate text-xs text-gray-400 dark:text-gray-500">
                      {m.tournament.name} · R{m.round}
                    </p>
                    <p className="text-right font-mono text-sm tabular-nums text-gray-900 dark:text-gray-100">
                      <span
                        className={!aWon && !isDraw ? "text-gray-400 dark:text-gray-500" : ""}
                      >
                        {teamAName}
                      </span>{" "}
                      <span className="font-bold">
                        {m.scoreA}–{m.scoreB}
                      </span>{" "}
                      <span
                        className={aWon && !isDraw ? "text-gray-400 dark:text-gray-500" : ""}
                      >
                        {teamBName}
                      </span>
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}