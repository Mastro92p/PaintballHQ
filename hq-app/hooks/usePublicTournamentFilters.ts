"use client";

import { useMemo, useState } from "react";
import type { Division } from "@/types";
import type { TournamentWithDetails } from "@/lib/tournaments/tournamentList";

type UsePublicTournamentFiltersArgs = {
  tournaments: TournamentWithDetails[] | null | undefined;
  divisions: Division[] | null | undefined;
};

export function usePublicTournamentFilters({
  tournaments,
  divisions,
}: UsePublicTournamentFiltersArgs) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");

  const publicTournaments = useMemo(() => {
    return (tournaments ?? []).filter((t) => t.division?.isActive !== false);
  }, [tournaments]);

  const publicDivisions = useMemo(() => {
    return (divisions ?? []).filter((d) => d.isActive !== false);
  }, [divisions]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { "": publicTournaments.length };

    for (const t of publicTournaments) {
      c[t.status] = (c[t.status] ?? 0) + 1;
    }

    return c;
  }, [publicTournaments]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    return publicTournaments
      .filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.location ?? "").toLowerCase().includes(query)
      )
      .filter((t) => status === "" || t.status === status)
      .filter((t) => {
        if (divisionFilter === "all") return true;
        if (divisionFilter === "unassigned") return t.divisionId == null;
        return t.divisionId === Number(divisionFilter);
      });
  }, [publicTournaments, search, status, divisionFilter]);

  return {
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
  };
}