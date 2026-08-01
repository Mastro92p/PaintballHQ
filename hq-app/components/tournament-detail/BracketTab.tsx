"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BracketMatchEditModal } from "@/components/tournament-detail/BracketMatchEditModal";
import type { Match, Team, TournamentBracket } from "@/types";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";

type SaveBracketEditInput = {
  matchId: number;
  teamAId: number | null;
  teamBId: number | null;
  scoreA?: number | null;
  scoreB?: number | null;
};

type GenerateBracketInput = {
  advancingTeams?: number;
};

type Props = {
  brackets?: TournamentBracket[];
  activeBracketId?: number | null;
  onSelectBracket?: (bracketId: number) => void;
  onAddBracket?: () => void;
  onRenameBracket?: (bracketId: number, name: string) => void;
  onDeleteBracket?: (bracketId: number) => void;
  onReorderBrackets?: (bracketIds: number[]) => void | Promise<void>;
  renamingBracket?: boolean;
  deletingBracket?: boolean;

  matches: Match[];
  editableTeams?: Team[];
  hasBracketMatches: boolean;
  generatingBracket?: boolean;
  resettingBracket?: boolean;
  bracketError?: string | null;
  managementMode?: "auto" | "manual";
  onGenerateBracket?: (input?: GenerateBracketInput) => void;
  onResetBracket?: () => void;
  editingBracketMatch?: Match | null;
  bracketEditSaving?: boolean;
  onOpenBracketEdit?: (match: Match) => void;
  onCloseBracketEdit?: () => void;
  onSaveBracketEdit?: (input: SaveBracketEditInput) => void;
  readonly?: boolean;
};

type PhaseKey =
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "final"
  | "third_place";

type CardVariant = "default" | "gold" | "bronze";

type BracketMatch = Match & {
  phase: string;
  nextMatchId?: number | null;
};

type PositionedMatch = {
  match: BracketMatch;
  x: number;
  y: number;
  phase: PhaseKey;
  roundIndex: number;
  index: number;
};

const PHASE_ORDER: Record<PhaseKey, number> = {
  round_of_32: 1,
  round_of_16: 2,
  quarter_final: 3,
  semi_final: 4,
  final: 5,
  third_place: 6,
};

const ROUND_TITLES: Record<PhaseKey, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarterfinals",
  semi_final: "Semifinals",
  final: "Final",
  third_place: "3rd Place",
};

const CARD_WIDTH = 188;
const CARD_HEIGHT = 54;
const SCORE_COL_WIDTH = 24;
const ROUND_GAP = 40;
const OUTER_PADDING_X = 24;
const OUTER_PADDING_Y = 20;
const FIRST_ROUND_GAP = 18;
const ROUND_MIN_GAP = 28;
const LABEL_HEIGHT = 22;

function SortableBracketTabButton({
  bracket,
  index,
  selected,
  subtitle,
  onSelect,
}: {
  bracket: TournamentBracket;
  index: number;
  selected: boolean;
  subtitle?: string;
  onSelect: (bracketId: number) => void;
}) {
  const { ref, isDragging } = useSortable({
    id: String(bracket.id),
    index,
    type: "bracket-tab",
    accept: "bracket-tab",
  });

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(bracket.id)}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-none ${
        selected
          ? "bg-teal-600 text-white"
          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      } ${isDragging ? "opacity-60" : ""}`}
      title={bracket.name ?? "Bracket"}
    >
      {bracket.name?.trim() || "Bracket"}
      {subtitle && <span className="ml-2 text-xs opacity-80">{subtitle}</span>}
    </button>
  );
}

function isPhaseKey(value: string): value is PhaseKey {
  return value in PHASE_ORDER;
}

function getTeamDisplay(team: Team | null | undefined) {
  return team?.name?.trim() || "TBD";
}

function getMatchSortValue(match: Match) {
  return match.bracketOrder ?? match.nextMatchOrder ?? match.round ?? match.id;
}

function getRoundTitle(phase: PhaseKey) {
  return ROUND_TITLES[phase] ?? phase.replace(/_/g, " ");
}

function getCardPalette(variant: CardVariant) {
  if (variant === "gold") {
    return {
      border: "1px solid rgba(234,179,8,0.88)",
      scoreBg: "linear-gradient(180deg, #4a3a12 0%, #35290c 100%)",
      scoreBorder: "1px solid rgba(234,179,8,0.30)",
      connector: "rgba(234,179,8,0.92)",
    };
  }

  if (variant === "bronze") {
    return {
      border: "1px solid rgba(223,155,67,0.80)",
      scoreBg: "linear-gradient(180deg, #4b3420 0%, #372618 100%)",
      scoreBorder: "1px solid rgba(223,155,67,0.26)",
      connector: "rgba(223,155,67,0.92)",
    };
  }

  return {
    border: "1px solid rgba(70,78,90,0.95)",
    scoreBg: "linear-gradient(180deg, #2b3037 0%, #22262c 100%)",
    scoreBorder: "1px solid rgba(76,83,92,0.9)",
    connector: "rgba(194, 200, 211, 0.88)",
  };
}

function MatchCard({
  item,
  variant = "default",
  onOpen,
  interactive,
}: {
  item: PositionedMatch;
  variant?: CardVariant;
  onOpen?: (match: Match) => void;
  interactive: boolean;
}) {
  const { match, x, y, phase } = item;
  const palette = getCardPalette(variant);

  const scoreA = match.scoreA ?? null;
  const scoreB = match.scoreB ?? null;

  const isCompleted =
    match.status === "completed" && scoreA != null && scoreB != null;

  const aWins = isCompleted && scoreA > scoreB;
  const bWins = isCompleted && scoreB > scoreA;
  const isDraw = isCompleted && scoreA === scoreB;

  const isFinal = phase === "final";
  const isThirdPlace = phase === "third_place";

  const winnerStyles = isFinal
    ? {
        row: {
          background:
            "linear-gradient(90deg, rgba(234,179,8,0.30) 0%, rgba(234,179,8,0.14) 72%, rgba(234,179,8,0.03) 100%)",
        },
        text: "#fde68a",
        score: "#facc15",
        accent: "rgba(234,179,8,0.95)",
      }
    : isThirdPlace
    ? {
        row: {
          background:
            "linear-gradient(90deg, rgba(180,83,9,0.28) 0%, rgba(180,83,9,0.14) 72%, rgba(180,83,9,0.03) 100%)",
        },
        text: "#fdba74",
        score: "#fb923c",
        accent: "rgba(249,115,22,0.95)",
      }
    : {
        row: {
          background:
            "linear-gradient(90deg, rgba(22,101,52,0.30) 0%, rgba(22,101,52,0.14) 72%, rgba(22,101,52,0.03) 100%)",
        },
        text: "#bbf7d0",
        score: "#34d399",
        accent: "rgba(31,214,162,0.95)",
      };

  const loserStyles = isFinal
    ? {
        row: {
          background:
            "linear-gradient(90deg, rgba(148,163,184,0.22) 0%, rgba(148,163,184,0.10) 72%, rgba(148,163,184,0.03) 100%)",
        },
        text: "#e2e8f0",
        score: "#cbd5e1",
      }
    : isThirdPlace
    ? {
        row: undefined,
        text: "#f1f5f9",
        score: "rgb(226 232 240)",
      }
    : {
        row: {
          background:
            "linear-gradient(90deg, rgba(127,29,29,0.26) 0%, rgba(127,29,29,0.12) 72%, rgba(127,29,29,0.03) 100%)",
        },
        text: "#fecaca",
        score: "#f87171",
      };

  const rowAStyle = aWins ? winnerStyles.row : bWins ? loserStyles.row : undefined;
  const rowBStyle = bWins ? winnerStyles.row : aWins ? loserStyles.row : undefined;

  const nameAClass = !match.teamA
    ? "text-slate-300"
    : !isCompleted
    ? "text-slate-100"
    : "";
  const nameBClass = !match.teamB
    ? "text-slate-300"
    : !isCompleted
    ? "text-slate-100"
    : "";

  const teamAInlineColor = aWins
    ? winnerStyles.text
    : bWins
    ? loserStyles.text
    : undefined;

  const teamBInlineColor = bWins
    ? winnerStyles.text
    : aWins
    ? loserStyles.text
    : undefined;

  const scoreAColor = aWins
    ? winnerStyles.score
    : bWins
    ? loserStyles.score
    : "rgb(226 232 240)";

  const scoreBColor = bWins
    ? winnerStyles.score
    : aWins
    ? loserStyles.score
    : "rgb(226 232 240)";

  const showAccentBar = (aWins || bWins) && !isDraw;

  const content = (
    <>
      <div
        className="absolute inset-y-0 right-0"
        style={{
          width: SCORE_COL_WIDTH,
          background: palette.scoreBg,
          borderLeft: palette.scoreBorder,
        }}
      />

      {showAccentBar && (
        <div
          className="absolute left-0 top-0 h-full w-[2px]"
          style={{ background: winnerStyles.accent }}
        />
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div
          className="flex flex-1 items-center"
          style={{
            borderBottom: "1px solid rgba(57,62,70,0.95)",
            ...(rowAStyle ?? {}),
          }}
        >
          <div className="min-w-0 flex-1 px-2.5">
            <div
              className={`truncate text-[11px] font-semibold leading-none ${nameAClass}`}
              style={teamAInlineColor ? { color: teamAInlineColor } : undefined}
            >
              {getTeamDisplay(match.teamA)}
            </div>
          </div>
          <div
            className="flex h-full items-center justify-center text-[11px] font-semibold"
            style={{
              width: SCORE_COL_WIDTH,
              color: scoreAColor,
            }}
          >
            {scoreA ?? ""}
          </div>
        </div>

        <div className="flex flex-1 items-center" style={rowBStyle}>
          <div className="min-w-0 flex-1 px-2.5">
            <div
              className={`truncate text-[11px] font-semibold leading-none ${nameBClass}`}
              style={teamBInlineColor ? { color: teamBInlineColor } : undefined}
            >
              {getTeamDisplay(match.teamB)}
            </div>
          </div>
          <div
            className="flex h-full items-center justify-center text-[11px] font-semibold"
            style={{
              width: SCORE_COL_WIDTH,
              color: scoreBColor,
            }}
          >
            {scoreB ?? ""}
          </div>
        </div>
      </div>

      {interactive && (
        <div className="pointer-events-none absolute inset-0 bg-white/0 transition-colors duration-150 group-hover:bg-white/[0.03]" />
      )}
    </>
  );

  const baseStyle = {
    left: x,
    top: y,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    background: "linear-gradient(180deg, #191c22 0%, #12151a 100%)",
    border: palette.border,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
  } as const;

  if (!interactive) {
    return (
      <div
        className="absolute overflow-hidden rounded-[3px] text-left"
        style={baseStyle}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen?.(match)}
      className="group absolute overflow-hidden rounded-[3px] text-left focus:outline-none focus:ring-2 focus:ring-teal-500"
      style={baseStyle}
    >
      {content}
    </button>
  );
}

function RoundLabel({
  x,
  y,
  title,
  variant = "default",
}: {
  x: number;
  y: number;
  title: string;
  variant?: CardVariant;
}) {
  const palette =
    variant === "gold"
      ? {
          background: "rgba(92,72,16,0.94)",
          color: "rgba(255,236,179,0.98)",
          border: "1px solid rgba(234,179,8,0.34)",
        }
      : variant === "bronze"
      ? {
          background: "rgba(94,58,25,0.92)",
          color: "rgba(255,221,173,0.96)",
          border: "1px solid rgba(223,155,67,0.28)",
        }
      : {
          background: "rgba(49,52,58,0.92)",
          color: "rgba(233,236,240,0.92)",
          border: "1px solid rgba(72,76,84,0.95)",
        };

  return (
    <div
      className="absolute flex items-center justify-center px-3 text-[11px] font-medium"
      style={{
        left: x,
        top: y,
        width: CARD_WIDTH,
        height: 20,
        background: palette.background,
        color: palette.color,
        border: palette.border,
      }}
    >
      {title}
    </div>
  );
}

function ConnectorSet({
  fromX,
  fromY,
  toX,
  toY,
  color,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}) {
  const elbowX = fromX + Math.max(14, Math.floor((toX - fromX) * 0.48));
  const topY = Math.min(fromY, toY);
  const bottomY = Math.max(fromY, toY);

  return (
    <>
      <div
        className="absolute"
        style={{
          left: fromX,
          top: fromY,
          width: elbowX - fromX,
          height: 1,
          background: color,
        }}
      />
      <div
        className="absolute"
        style={{
          left: elbowX,
          top: topY,
          width: 1,
          height: Math.max(1, bottomY - topY),
          background: color,
        }}
      />
      <div
        className="absolute"
        style={{
          left: elbowX,
          top: toY,
          width: Math.max(10, toX - elbowX),
          height: 1,
          background: color,
        }}
      />
    </>
  );
}

function ManualAdvancingTeamsModal({
  open,
  teamCount,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  teamCount: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: (advancingTeams: number) => void;
}) {
  const [advancingTeams, setAdvancingTeams] = useState<number>(
    Math.min(teamCount, 2)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAdvancingTeams(Math.min(Math.max(2, teamCount), teamCount));
    setError(null);
  }, [open, teamCount]);

  if (!open) return null;

  const projectedBracketSize =
    advancingTeams >= 2 ? 2 ** Math.ceil(Math.log2(advancingTeams)) : 0;
  const projectedByes =
    advancingTeams >= 2 ? projectedBracketSize - advancingTeams : 0;

  const handleSubmit = () => {
    if (!Number.isInteger(advancingTeams) || advancingTeams < 2) {
      setError("Advancing teams must be at least 2.");
      return;
    }

    if (advancingTeams > teamCount) {
      setError("Advancing teams cannot exceed enrolled teams.");
      return;
    }

    setError(null);
    onConfirm(advancingTeams);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Generate Manual Bracket
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose how many teams advance. You currently have {teamCount} enrolled
            teams.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <label
            htmlFor="manual-advancing-teams"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Advancing teams
          </label>
          <input
            id="manual-advancing-teams"
            type="number"
            min={2}
            max={teamCount}
            step={1}
            value={advancingTeams}
            onChange={(e) => setAdvancingTeams(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
            This will create a {projectedBracketSize}-slot bracket with {projectedByes}{" "}
            {projectedByes === 1 ? "bye" : "byes"} if needed.
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={loading}
            onClick={handleSubmit}
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BracketTab({
  brackets = [],
  activeBracketId = null,
  onSelectBracket,
  onAddBracket,
  onRenameBracket,
  onDeleteBracket,
  renamingBracket = false,
  deletingBracket = false,
  matches,
  editableTeams = [],
  hasBracketMatches,
  generatingBracket = false,
  resettingBracket = false,
  bracketError = null,
  managementMode = "auto",
  onGenerateBracket,
  onResetBracket,
  editingBracketMatch = null,
  bracketEditSaving = false,
  onOpenBracketEdit,
  onCloseBracketEdit,
  onSaveBracketEdit,
  onReorderBrackets,
  readonly = false,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const [isRenamingBracket, setIsRenamingBracket] = useState(false);
  const [bracketNameDraft, setBracketNameDraft] = useState("");
  const [sortableBrackets, setSortableBrackets] = useState(brackets);
  const [isDraggingBrackets, setIsDraggingBrackets] = useState(false);

  const panStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const activeBracket = useMemo(
    () => brackets.find((bracket) => bracket.id === activeBracketId) ?? null,
    [brackets, activeBracketId]
  );

  useEffect(() => {
    setIsRenamingBracket(false);
    setBracketNameDraft(activeBracket?.name?.trim() || "");
  }, [activeBracket?.id, activeBracket?.name]);

  useEffect(() => {
    if (!isDraggingBrackets) {
      setSortableBrackets(
        [...brackets].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      );
    }
  }, [brackets, isDraggingBrackets]);

  const {
    mainPhases,
    positionedMainMatches,
    positionedThirdPlaceMatches,
    canvasWidth,
    canvasHeight,
    positionsById,
  } = useMemo(() => {
    const bracketMatches = matches.filter(
      (m): m is BracketMatch =>
        Boolean(m.phase && m.phase !== "group" && typeof m.phase === "string")
    );

    const mainMatches = bracketMatches.filter((m) => m.phase !== "third_place");
    const thirdPlaceMatches = bracketMatches.filter(
      (m) => m.phase === "third_place"
    );

    const phases = Array.from(
      new Set(
        mainMatches
          .map((m) => m.phase)
          .filter((phase): phase is PhaseKey => isPhaseKey(phase))
      )
    ).sort((a, b) => PHASE_ORDER[a] - PHASE_ORDER[b]);

    const phaseBuckets = new Map<PhaseKey, BracketMatch[]>();
    const positionsById = new Map<number, PositionedMatch>();
    const incomingByTargetId = new Map<number, BracketMatch[]>();
    const positionedMainMatches: PositionedMatch[] = [];

    for (const match of mainMatches) {
      if (match.nextMatchId != null) {
        const list = incomingByTargetId.get(match.nextMatchId) ?? [];
        list.push(match);
        incomingByTargetId.set(match.nextMatchId, list);
      }
    }

    phases.forEach((phase) => {
      const roundMatches = mainMatches
        .filter((m) => m.phase === phase)
        .sort((a, b) => getMatchSortValue(a) - getMatchSortValue(b));

      phaseBuckets.set(phase, roundMatches);
    });

    const firstPhase = phases[0];
    const firstRoundMatches = firstPhase ? phaseBuckets.get(firstPhase) ?? [] : [];
    const startY = OUTER_PADDING_Y + LABEL_HEIGHT + 14;

    if (firstPhase) {
      const x = OUTER_PADDING_X;

      firstRoundMatches.forEach((match, index) => {
        const y = startY + index * (CARD_HEIGHT + FIRST_ROUND_GAP);
        const item: PositionedMatch = {
          match,
          x,
          y,
          phase: firstPhase,
          roundIndex: 0,
          index,
        };
        positionedMainMatches.push(item);
        positionsById.set(match.id, item);
      });
    }

    for (let roundIndex = 1; roundIndex < phases.length; roundIndex += 1) {
      const phase = phases[roundIndex];
      const roundMatches = phaseBuckets.get(phase) ?? [];
      const x = OUTER_PADDING_X + roundIndex * (CARD_WIDTH + ROUND_GAP);

      let previousY: number | null = null;

      roundMatches.forEach((match, index) => {
        const incomingMatches = (incomingByTargetId.get(match.id) ?? [])
          .map((source) => positionsById.get(source.id))
          .filter(Boolean) as PositionedMatch[];

        let idealY = startY;

        if (incomingMatches.length > 0) {
          const centerAverage =
            incomingMatches.reduce(
              (sum, source) => sum + source.y + CARD_HEIGHT / 2,
              0
            ) / incomingMatches.length;
          idealY = centerAverage - CARD_HEIGHT / 2;
        } else {
          idealY = startY + index * (CARD_HEIGHT + ROUND_MIN_GAP);
        }

        const minAllowedY =
          previousY == null ? idealY : previousY + CARD_HEIGHT + ROUND_MIN_GAP;

        const y = Math.max(idealY, minAllowedY);

        const item: PositionedMatch = {
          match,
          x,
          y,
          phase,
          roundIndex,
          index,
        };

        positionedMainMatches.push(item);
        positionsById.set(match.id, item);
        previousY = y;
      });
    }

    let maxBottom = positionedMainMatches.reduce(
      (max, item) => Math.max(max, item.y + CARD_HEIGHT),
      OUTER_PADDING_Y + LABEL_HEIGHT + CARD_HEIGHT
    );

    const positionedThirdPlaceMatches: PositionedMatch[] = [];
    if (thirdPlaceMatches.length > 0) {
      const x =
        OUTER_PADDING_X + Math.max(0, phases.length - 1) * (CARD_WIDTH + ROUND_GAP);

      thirdPlaceMatches
        .sort((a, b) => getMatchSortValue(a) - getMatchSortValue(b))
        .forEach((match, index) => {
          const incomingMatches = (incomingByTargetId.get(match.id) ?? [])
            .map((source) => positionsById.get(source.id))
            .filter(Boolean) as PositionedMatch[];

          let idealY = maxBottom + 44 + index * (CARD_HEIGHT + 12);

          if (incomingMatches.length > 0) {
            const centerAverage =
              incomingMatches.reduce(
                (sum, source) => sum + source.y + CARD_HEIGHT / 2,
                0
              ) / incomingMatches.length;
            idealY = Math.max(
              maxBottom + 28,
              centerAverage - CARD_HEIGHT / 2 + 48
            );
          }

          const item: PositionedMatch = {
            match,
            x,
            y: idealY,
            phase: "third_place",
            roundIndex: phases.length - 1,
            index,
          };

          positionedThirdPlaceMatches.push(item);
          positionsById.set(match.id, item);
          maxBottom = Math.max(maxBottom, item.y + CARD_HEIGHT);
        });
    }

    const width =
      OUTER_PADDING_X * 2 +
      Math.max(1, phases.length) * CARD_WIDTH +
      Math.max(0, phases.length - 1) * ROUND_GAP;

    const height = Math.max(280, maxBottom + OUTER_PADDING_Y);

    return {
      mainPhases: phases,
      positionedMainMatches,
      positionedThirdPlaceMatches,
      canvasWidth: width,
      canvasHeight: height,
      positionsById,
    };
  }, [matches]);

  useEffect(() => {
    const updateScale = () => {
      if (!wrapperRef.current) return;
      const availableWidth = wrapperRef.current.clientWidth - 5;
      const nextFitScale = Math.min(1, availableWidth / canvasWidth);
      setFitScale(nextFitScale > 0 ? nextFitScale : 1);
    };

    updateScale();

    const observer = new ResizeObserver(() => updateScale());
    if (wrapperRef.current) observer.observe(wrapperRef.current);

    window.addEventListener("resize", updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [canvasWidth]);

  const connectors = useMemo(() => {
    const lines: Array<{
      key: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      color: string;
    }> = [];

    const allPositioned = [...positionedMainMatches, ...positionedThirdPlaceMatches];

    allPositioned.forEach((item) => {
      const nextMatchId = item.match.nextMatchId;
      if (nextMatchId == null) return;

      const to = positionsById.get(nextMatchId);
      if (!to) return;

      const variant: CardVariant =
        to.phase === "third_place"
          ? "bronze"
          : to.phase === "final"
          ? "gold"
          : "default";

      lines.push({
        key: `${item.match.id}-${nextMatchId}`,
        fromX: item.x + CARD_WIDTH,
        fromY: item.y + CARD_HEIGHT / 2,
        toX: to.x,
        toY: to.y + CARD_HEIGHT / 2,
        color: getCardPalette(variant).connector,
      });
    });

    return lines;
  }, [positionedMainMatches, positionedThirdPlaceMatches, positionsById]);

  const scale = Math.max(0.9, Math.min(1.35, fitScale * zoom));
  const scaledWidth = canvasWidth * scale;
  const scaledHeight = canvasHeight * scale;
  const canPan = scale > fitScale + 0.01;
  const isManual = managementMode === "manual";
  const hasActiveBracket = activeBracketId != null;
  const interactive = !readonly && !!onOpenBracketEdit;

  const canGenerate =
    hasActiveBracket &&
    editableTeams.length >= 2 &&
    !hasBracketMatches &&
    !generatingBracket;

  const handleGenerateClick = () => {
    if (!onGenerateBracket || !canGenerate) return;

    if (isManual) {
      setManualModalOpen(true);
      return;
    }

    onGenerateBracket();
  };

  const handleConfirmManualGenerate = (advancingTeams: number) => {
    onGenerateBracket?.({ advancingTeams });
    setManualModalOpen(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canPan || !wrapperRef.current) return;

    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    panStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: wrapperRef.current.scrollLeft,
      scrollTop: wrapperRef.current.scrollTop,
    };

    setIsPanning(true);
    wrapperRef.current.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panStateRef.current.active || !wrapperRef.current) return;

    const dx = event.clientX - panStateRef.current.startX;
    const dy = event.clientY - panStateRef.current.startY;

    wrapperRef.current.scrollLeft = panStateRef.current.scrollLeft - dx;
    wrapperRef.current.scrollTop = panStateRef.current.scrollTop - dy;
  };

  const endPan = (event?: React.PointerEvent<HTMLDivElement>) => {
    if (event && wrapperRef.current?.hasPointerCapture?.(event.pointerId)) {
      wrapperRef.current.releasePointerCapture(event.pointerId);
    }

    panStateRef.current.active = false;
    setIsPanning(false);
  };

  const handleBracketsDragStart = useCallback(() => {
    setIsDraggingBrackets(true);
  }, []);

  const handleBracketsDragEnd = useCallback(
    async (event: any) => {
      setIsDraggingBrackets(false);

      const nextBrackets = move(sortableBrackets, event);

      if (
        nextBrackets.length === sortableBrackets.length &&
        nextBrackets.every((bracket, index) => bracket.id === sortableBrackets[index]?.id)
      ) {
        return;
      }

      setSortableBrackets(nextBrackets);

      try {
        await onReorderBrackets?.(nextBrackets.map((bracket) => bracket.id));
      } catch (error) {
        console.error(error);
        setSortableBrackets(
          [...brackets].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        );
      }
    },
    [sortableBrackets, brackets, onReorderBrackets]
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Bracket
        </h2>

        {!readonly && (
          <div className="flex items-center gap-2">
            {hasBracketMatches && (
              <Button
                size="sm"
                variant="danger"
                loading={resettingBracket}
                onClick={onResetBracket}
                disabled={!hasActiveBracket}
              >
                ↺ Reset Bracket
              </Button>
            )}

            <Button
              size="sm"
              loading={generatingBracket}
              disabled={!canGenerate}
              title={
                !hasActiveBracket
                  ? "Add or select a bracket first"
                  : hasBracketMatches
                  ? "Reset the bracket first"
                  : editableTeams.length < 2
                  ? "Enroll at least 2 teams first"
                  : isManual
                  ? "Choose how many teams advance"
                  : ""
              }
              onClick={handleGenerateClick}
            >
              ⚡ Generate Bracket
            </Button>
          </div>
        )}
      </div>

      <DragDropProvider
        onDragStart={!readonly ? handleBracketsDragStart : undefined}
        onDragEnd={!readonly ? handleBracketsDragEnd : undefined}
      >
        <div className="flex flex-wrap gap-2">
          {sortableBrackets.map((bracket, index) =>
            !readonly ? (
              <SortableBracketTabButton
                key={bracket.id}
                bracket={bracket}
                index={index}
                selected={bracket.id === activeBracketId}
                onSelect={(bracketId) => onSelectBracket?.(bracketId)}
              />
            ) : (
              <button
                key={bracket.id}
                type="button"
                onClick={() => onSelectBracket?.(bracket.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  bracket.id === activeBracketId
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                title={bracket.name ?? `Bracket ${index + 1}`}
              >
                {bracket.name?.trim() || `B${index + 1}`}
              </button>
            )
          )}

          {!readonly && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onAddBracket}
            >
              + Add
            </Button>
          )}
        </div>
      </DragDropProvider>

      {hasActiveBracket && (
        <div className="flex items-center gap-3">
          {isRenamingBracket && activeBracket ? (
            <>
              <input
                autoFocus
                value={bracketNameDraft}
                onChange={(e) => setBracketNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const nextName = bracketNameDraft.trim();
                    if (nextName) {
                      onRenameBracket?.(activeBracket.id, nextName);
                    }
                    setIsRenamingBracket(false);
                  }

                  if (e.key === "Escape") {
                    setBracketNameDraft(activeBracket.name?.trim() || "");
                    setIsRenamingBracket(false);
                  }
                }}
                className="w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Bracket name"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={renamingBracket}
                onClick={() => {
                  const nextName = bracketNameDraft.trim();
                  if (activeBracket && nextName) {
                    onRenameBracket?.(activeBracket.id, nextName);
                  }
                  setIsRenamingBracket(false);
                }}
              >
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setBracketNameDraft(activeBracket.name?.trim() || "");
                  setIsRenamingBracket(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {activeBracket?.name?.trim() || "Bracket"}
              </span>
              <span className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />

              {!readonly && activeBracket && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRenamingBracket(true)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    disabled={deletingBracket}
                    onClick={() => onDeleteBracket?.(activeBracket.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {deletingBracket ? "Deleting…" : "Delete"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {readonly
          ? "Knockout bracket."
          : isManual
          ? "Manual knockout bracket with direct match editing and automatic byes."
          : "Knockout bracket with direct match editing."}
      </p>

      {!readonly && bracketError && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
          {bracketError}
        </div>
      )}

      {!hasActiveBracket ? (
        <div className="text-center py-10 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
          <p className="text-2xl mb-2">🏆</p>
          <p className="font-medium">No bracket selected</p>
          <p className="text-sm mt-1">
            Create a bracket tab first, then generate its knockout stage.
          </p>
        </div>
      ) : !hasBracketMatches ? (
        <div className="text-center py-10 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
          <p className="text-2xl mb-2">🏆</p>
          <p className="font-medium">
            {readonly ? "Bracket not available yet" : "This bracket is empty"}
          </p>
          <p className="text-sm mt-1">
            {readonly
              ? "The knockout stage will appear here once it has been generated."
              : isManual
              ? "Generate this bracket and choose how many teams advance to start the knockout stage."
              : "Generate this bracket to start the knockout stage."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {canPan ? "Drag to pan" : "Zoom in to pan around"}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() =>
                  setZoom((z) => Math.max(0.9, +(z - 0.1).toFixed(2)))
                }
              >
                −
              </button>

              <button
                type="button"
                className="rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setZoom(1)}
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() =>
                  setZoom((z) => Math.min(1.35, +(z + 0.1).toFixed(2)))
                }
              >
                +
              </button>
            </div>
          </div>

          <div
            ref={wrapperRef}
            className="relative w-full overflow-auto rounded-lg"
            style={{
              cursor: canPan ? (isPanning ? "grabbing" : "grab") : "default",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPan}
            onPointerLeave={endPan}
            onPointerCancel={endPan}
          >
            <div
              style={{
                width: Math.max(
                  scaledWidth,
                  wrapperRef.current?.clientWidth ?? 0
                ),
                height: scaledHeight,
                position: "relative",
              }}
            >
              <div
                className="relative origin-top-left select-none"
                style={{
                  width: canvasWidth,
                  minHeight: canvasHeight,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  background:
                    "linear-gradient(180deg, #0c0f14 0%, #090c11 100%)",
                }}
              >
                {mainPhases.map((phase) => {
                  const first = positionedMainMatches.find(
                    (m) => m.phase === phase
                  );
                  if (!first) return null;

                  return (
                    <RoundLabel
                      key={`label-${phase}`}
                      x={first.x}
                      y={OUTER_PADDING_Y}
                      title={getRoundTitle(phase)}
                      variant={phase === "final" ? "gold" : "default"}
                    />
                  );
                })}

                {positionedThirdPlaceMatches.length > 0 && (
                  <RoundLabel
                    key="label-third_place"
                    x={positionedThirdPlaceMatches[0].x}
                    y={positionedThirdPlaceMatches[0].y - LABEL_HEIGHT - 6}
                    title={getRoundTitle("third_place")}
                    variant="bronze"
                  />
                )}

                {connectors.map((line) => (
                  <ConnectorSet
                    key={line.key}
                    fromX={line.fromX}
                    fromY={line.fromY}
                    toX={line.toX}
                    toY={line.toY}
                    color={line.color}
                  />
                ))}

                {positionedMainMatches.map((item) => (
                  <MatchCard
                    key={item.match.id}
                    item={item}
                    interactive={interactive}
                    onOpen={onOpenBracketEdit}
                    variant={item.phase === "final" ? "gold" : "default"}
                  />
                ))}

                {positionedThirdPlaceMatches.map((item) => (
                  <MatchCard
                    key={item.match.id}
                    item={item}
                    interactive={interactive}
                    onOpen={onOpenBracketEdit}
                    variant="bronze"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!readonly && (
        <ManualAdvancingTeamsModal
          open={manualModalOpen}
          teamCount={editableTeams.length}
          loading={generatingBracket}
          onClose={() => setManualModalOpen(false)}
          onConfirm={handleConfirmManualGenerate}
        />
      )}

      {!readonly && (
        <BracketMatchEditModal
          open={!!editingBracketMatch}
          match={editingBracketMatch}
          teams={editableTeams}
          loading={bracketEditSaving}
          onClose={() => onCloseBracketEdit?.()}
          onSave={(input) => onSaveBracketEdit?.(input)}
        />
      )}
    </section>
  );
}