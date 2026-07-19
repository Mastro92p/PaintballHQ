"use client";

import Link from "next/link";
import type { LeagueDetail } from "@/types";

type Tab = "tournaments" | "teams" | "info";

type LeaguePageHeaderProps = {
  league: LeagueDetail;
  activeTab: Tab;
  tabs: { key: Tab; label: string; count?: number }[];
  onTabChange: (tab: Tab) => void;
};

export function LeaguePageHeader({
  league,
  activeTab,
  tabs,
  onTabChange,
}: LeaguePageHeaderProps) {
  return (
    <section className="space-y-5">
      <Link
        href="/manage/leagues"
        className="inline-flex text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        ← Back to Leagues
      </Link>

      <div className="flex items-start gap-4">
        {league.logoUrl ? (
        <img
            src={league.logoUrl}
            alt={`${league.name} logo`}
            className="h-14 w-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        />
        ) : (
        <div className="h-14 w-14 rounded-xl border border-gray-700 bg-slate-800/80 flex flex-col items-center justify-center text-[10px] text-gray-400 shrink-0">
            <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 mb-1 text-gray-500"
            aria-hidden="true"
            >
            <path d="M4 19V5" />
            <path d="M4 6c2-1 4-1 6 0s4 1 6 0 4-1 4 0v8c-2-1-4-1-6 0s-4 1-6 0-4-1-4 0" />
            </svg>
            <span>No logo</span>
        </div>
        )}

        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {league.name}
          </h1>
          {league.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {league.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}