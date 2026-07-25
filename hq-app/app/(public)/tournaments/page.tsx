"use client";

import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import { usePublicTournamentFilters } from "@/hooks/usePublicTournamentFilters";
import { DivisionFilterChips } from "@/components/divisions/DivisionFilterChips";
import { TournamentStatusTabs } from "@/components/tournaments/TournamentStatusTabs";
import { TournamentListItem } from "@/components/tournaments/TournamentListItem";
import { TournamentsPageHeader } from "@/components/tournaments/TournamentsPageHeader";
import { TournamentsLoadingState } from "@/components/tournaments/TournamentsLoadingState";
import { TournamentsEmptyState } from "@/components/tournaments/TournamentsEmptyState";
import { TournamentsErrorState } from "@/components/tournaments/TournamentsErrorState";
import type { Division } from "@/types";
import type { TournamentWithDetails } from "@/lib/tournamentList";

export default function TournamentsPage() {
  const { data, loading, error } = useFetch<TournamentWithDetails[]>("/api/public/tournaments");
  const { data: divisions } = useFetch<Division[]>("/api/divisions");
  const router = useRouter();

  const {
    search,
    setSearch,
    status,
    setStatus,
    divisionFilter,
    setDivisionFilter,
    publicTournaments,
    publicDivisions,
    counts,
    filtered,
  } = usePublicTournamentFilters({
    tournaments: data,
    divisions,
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <TournamentsPageHeader
        total={publicTournaments.length}
        search={search}
        onSearchChange={setSearch}
      />

      <TournamentStatusTabs value={status} counts={counts} onChange={setStatus} />

      <DivisionFilterChips
        divisions={publicDivisions}
        value={divisionFilter}
        onChange={setDivisionFilter}
        includeAll
        includeUnassigned
      />

      {loading && <TournamentsLoadingState />}

      {error && <TournamentsErrorState error={error} />}

      {!loading && !error && (
        <>
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((t) => (
                <TournamentListItem
                  key={t.id}
                  tournament={t}
                  onClick={() => router.push(`/tournaments/${t.id}`)}
                />
              ))}
            </div>
          ) : (
            <TournamentsEmptyState />
          )}
        </>
      )}
    </main>
  );
}