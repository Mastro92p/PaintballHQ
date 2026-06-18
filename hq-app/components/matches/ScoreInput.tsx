"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Match } from "@/types";

type ScoreInputProps = {
  match: Match;
  onSave: (matchId: number, scoreA: number, scoreB: number) => Promise<void>;
};

export function ScoreInput({ match, onSave }: ScoreInputProps) {
  const [scoreA, setScoreA] = useState(match.scoreA?.toString() ?? "");
  const [scoreB, setScoreB] = useState(match.scoreB?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const sA = parseInt(scoreA);
    const sB = parseInt(scoreB);
    if (isNaN(sA) || isNaN(sB)) return;
    setLoading(true);
    await onSave(match.id, sA, sB);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass =
    "w-16 px-2 py-1.5 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-600 tabular-nums";

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={scoreA}
        onChange={(e) => { setScoreA(e.target.value); setSaved(false); }}
        className={inputClass}
        placeholder="0"
        aria-label={`Score for ${match.teamA?.name ?? "Team A"}`}
      />

      <span className="text-gray-400 text-sm font-medium">–</span>

      <input
        type="number"
        min={0}
        value={scoreB}
        onChange={(e) => { setScoreB(e.target.value); setSaved(false); }}
        className={inputClass}
        placeholder="0"
        aria-label={`Score for ${match.teamB?.name ?? "Team B"}`}
      />

      <Button
        size="sm"
        onClick={handleSave}
        loading={loading}
        disabled={scoreA === "" || scoreB === ""}
      >
        {saved ? "✓ Saved" : "Save"}
      </Button>
    </div>
  );
}