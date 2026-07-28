"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  getTournamentStatusBadgeVariant,
  getTournamentStatusLabel,
} from "@/lib/tournamentStatusStyles";
import { formatTournamentType } from "@/lib/tournamentType";
import type { TournamentDetail } from "@/types";

type Tab = "teams" | "matches" | "bracket" | "info";

type TournamentDetailHeaderProps = {
  tournament: TournamentDetail;
  tabs: { key: Tab; label: string; count?: number }[];
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onEditSettings: () => void;
};

export function TournamentDetailHeader({
  tournament,
  tabs,
  activeTab,
  onTabChange,
  onEditSettings,
}: TournamentDetailHeaderProps) {
  return (
    <>
      <Link
        href="/manage/tournaments"
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        ← Back to Tournaments
      </Link>

      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tournament.name}
          </h1>

          <Badge variant={getTournamentStatusBadgeVariant(tournament.status)}>
            {getTournamentStatusLabel(tournament.status)}
          </Badge>

          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 capitalize">
            {formatTournamentType(tournament.type)}
          </span>

          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {"Division: " + (tournament.division?.name ?? "Unassigned")}
          </span>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          📅 {formatDate(tournament.date)}
          {tournament.location && <span> · 📍 {tournament.location}</span>}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200/80 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex min-w-max gap-1 overflow-x-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                      activeTab === tab.key
                        ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onEditSettings}
          className="sm:shrink-0"
        >
          Edit Settings
        </Button>
      </div>
    </>
  );
}