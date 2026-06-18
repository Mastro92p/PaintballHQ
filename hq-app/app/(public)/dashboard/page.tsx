import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

const statusDot: Record<string, string> = {
  active:    "bg-green-500",
  upcoming:  "bg-orange-400",
  completed: "bg-gray-400 dark:bg-gray-500",
};

const statusLabel: Record<string, string> = {
  active:    "Active",
  upcoming:  "Upcoming",
  completed: "Completed",
};

export default async function DashboardPage() {
  const [allTournaments, teamsCount, matchesPlayed, pendingMatches, recentMatches] =
    await Promise.all([
      prisma.tournament.findMany({ orderBy: { date: "desc" } }),
      prisma.team.count(),
      prisma.match.count({ where: { status: "completed" } }),
      prisma.match.count({ where: { status: "pending" } }),
      prisma.match.findMany({
        where: { status: "completed" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { teamA: true, teamB: true, tournament: true },
      }),
    ]);

  const activeCount = allTournaments.filter((t) => t.status === "active").length;
  const upcomingCount = allTournaments.filter((t) => t.status === "upcoming").length;

  const kpis = [
    { label: "Tournaments", value: allTournaments.length, sub: `${activeCount} active` },
    { label: "Teams",        value: teamsCount,            sub: "Across all tournaments" },
    { label: "Matches Played", value: matchesPlayed,       sub: `${pendingMatches} pending` },
    { label: "Upcoming",     value: upcomingCount,          sub: "tournaments scheduled" },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Welcome back to PaintballHQ
        </p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {k.label}
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
              {k.value}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {k.sub}
            </p>
          </div>
        ))}
      </section>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tournaments — all in one panel */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Tournaments
            </h2>
            <Link
              href="/tournaments"
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              View all
            </Link>
          </div>

          {allTournaments.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              <p className="text-2xl mb-2">🏆</p>
              <p className="text-sm font-medium">No tournaments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {allTournaments.map((t) => (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t.date.slice(0, 10)}
                      {t.location && ` · ${t.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        t.status === "active"
                          ? "border-green-500/30 text-green-500 bg-green-500/10"
                          : t.status === "upcoming"
                          ? "border-orange-400/30 text-orange-400 bg-orange-400/10"
                          : "border-gray-400/30 text-gray-400 bg-gray-400/10"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[t.status]}`} />
                      {statusLabel[t.status] ?? t.status}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-teal-500 transition-colors"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Results */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Recent Results
            </h2>
          </div>

          {recentMatches.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              <p className="text-2xl mb-2">🎮</p>
              <p className="text-sm font-medium">No results yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentMatches.map((m) => {
                const isDraw = m.scoreA === m.scoreB;
                const aWon = (m.scoreA ?? 0) > (m.scoreB ?? 0);

                return (
                  <Link
                    key={m.id}
                    href={`/tournaments/${m.tournamentId}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <p className="text-xs text-gray-400 dark:text-gray-500 shrink-0 w-36 truncate">
                      {m.tournament.name} · R{m.round}
                    </p>
                    <p className="text-sm font-mono tabular-nums text-right text-gray-900 dark:text-gray-100">
                      <span className={!aWon && !isDraw ? "text-gray-400 dark:text-gray-500" : ""}>
                        {m.teamA.name}
                      </span>
                      {" "}
                      <span className="font-bold">
                        {m.scoreA}–{m.scoreB}
                      </span>
                      {" "}
                      <span className={aWon && !isDraw ? "text-gray-400 dark:text-gray-500" : ""}>
                        {m.teamB.name}
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