"use client";

export function LeagueDetailSkeleton() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      <div className="h-8 w-64 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
      <div className="h-10 w-72 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
      <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
    </main>
  );
}