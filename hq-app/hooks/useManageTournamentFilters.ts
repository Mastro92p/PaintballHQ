"use client";

import { useMemo, useState } from "react";
import type { Tournament } from "@/types";

type UseManageTournamentFiltersArgs = {
  tournaments: Tournament[];
};

export function useManageTournamentFilters({
  tournaments,
}: UseManageTournamentFiltersArgs) {
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");

  const filtered = useMemo(() => {
    return tournaments
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .filter((t) => {
        if (divisionFilter === "all") return true;
        if (divisionFilter === "unassigned") return t.divisionId == null;
        return t.divisionId === Number(divisionFilter);
      });
  }, [tournaments, search, divisionFilter]);

  return {
    search,
    setSearch,
    divisionFilter,
    setDivisionFilter,
    filtered,
  };
}