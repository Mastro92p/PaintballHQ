"use client";

import { use } from "react";
import Link from "next/link";
import { useFetch } from "@/hooks/use-fetch";
import { TeamHistoryModalContent } from "@/components/teams/TeamHistoryModalContent";
import { formatDate } from "@/lib/utils";
import type { TeamWithStats } from "@/types";

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, loading, error } = useFetch<TeamWithStats>(`/api/public/teams/${id}`);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-gray-400">Team not found</p>
        <Link
          href="/teams"
          className="text-sm text-teal-600 dark:text-teal-400 hover:underline mt-2 inline-block"
        >
          ← Back to Teams
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <Link
        href="/teams"
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        ← Back to Teams
      </Link>

      <div className="flex items-start gap-5">
        <div className="w-24 h-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
          {data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt={`${data.name} logo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-400">No logo</span>
          )}
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{"division".toUpperCase()}: {data.division?.name ?? "Unassigned"}</span>

            {data.createdAt && (
              <span className="flex items-center gap-1">
                📅 Registered {formatDate(data.createdAt)}
              </span>
            )}

            <span className="flex items-center gap-1">
              👤 {data.contact ?? "No contact listed"}
            </span>
          </div>
        </div>
      </div>

      <TeamHistoryModalContent team={data} />
    </main>
  );
}