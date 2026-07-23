"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BracketMatchEditModal } from "@/components/tournament-detail/BracketMatchEditModal";
import type { Match, Team } from "@/types";

type SaveBracketEditInput = {
  matchId: number;
  teamAId: number | null;
  teamBId: number | null;
  scoreA?: number | null;
  scoreB?: number | null;
};

type Props = {
  matches: Match[];
  editableTeams?: Team[];
  hasBracketMatches: boolean;
  generatingBracket?: boolean;
  resettingBracket?: boolean;
  bracketError?: string | null;
  onGenerateBracket?: () => void;
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
  const { match, x, y } = item;
  const palette = getCardPalette(variant);

  const scoreA = match.scoreA ?? null;
  const scoreB = match.scoreB ?? null;

  const aWins =
    match.status === "completed" &&
    scoreA != null &&
    scoreB != null &&
    scoreA > scoreB;

  const bWins =
    match.status === "completed" &&
    scoreA != null &&
    scoreB != null &&
    scoreB > scoreA;

  const winnerRowStyle = {
    background:
      "linear-gradient(90deg, rgba(22,101,52,0.30) 0%, rgba(22,101,52,0.14) 72%, rgba(22,101,52,0.03) 100%)",
  };

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

      {(aWins || bWins) && (
        <div
          className="absolute left-0 top-0 h-full w-[2px]"
          style={{ background: "rgba(31, 214, 162, 0.95)" }}
        />
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div
          className="flex flex-1 items-center"
          style={{
            borderBottom: "1px solid rgba(57,62,70,0.95)",
            ...(aWins ? winnerRowStyle : {}),
          }}
        >
          <div className="min-w-0 flex-1 px-2.5">
            <div
              className={`truncate text-[11px] font-semibold leading-none ${
                aWins ? "text-emerald-200" : "text-slate-100"
              }`}
            >
              {getTeamDisplay(match.teamA)}
            </div>
          </div>
          <div
            className="flex h-full items-center justify-center text-[11px] font-semibold"
            style={{
              width: SCORE_COL_WIDTH,
              color: aWins ? "#34d399" : "rgb(226 232 240)",
            }}
          >
            {scoreA ?? ""}
          </div>
        </div>

        <div
          className="flex flex-1 items-center"
          style={bWins ? winnerRowStyle : undefined}
        >
          <div className="min-w-0 flex-1 px-2.5">
            <div
              className={`truncate text-[11px] font-semibold leading-none ${
                !match.teamB
                  ? "text-slate-300"
                  : bWins
                  ? "text-emerald-200"
                  : "text-slate-100"
              }`}
            >
              {getTeamDisplay(match.teamB)}
            </div>
          </div>
          <div
            className="flex h-full items-center justify-center text-[11px] font-semibold"
            style={{
              width: SCORE_COL_WIDTH,
              color: bWins ? "#34d399" : "rgb(226 232 240)",
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

export function BracketTab({
  matches,
  editableTeams = [],
  hasBracketMatches,
  generatingBracket = false,
  resettingBracket = false,
  bracketError = null,
  onGenerateBracket,
  onResetBracket,
  editingBracketMatch = null,
  bracketEditSaving = false,
  onOpenBracketEdit,
  onCloseBracketEdit,
  onSaveBracketEdit,
  readonly = false,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);

  const panStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

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
    const thirdPlaceMatches = bracketMatches.filter((m) => m.phase === "third_place");

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
            incomingMatches.reduce((sum, source) => sum + source.y + CARD_HEIGHT / 2, 0) /
            incomingMatches.length;
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
            idealY = Math.max(maxBottom + 28, centerAverage - CARD_HEIGHT / 2 + 48);
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

  const interactive = !readonly && !!onOpenBracketEdit;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Bracket
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {readonly
              ? "knockout bracket."
              : "knockout bracket with direct match editing."}
          </p>
        </div>

        {!readonly && (
          <div className="flex items-center gap-2">
            {hasBracketMatches && (
              <Button
                size="sm"
                variant="danger"
                loading={resettingBracket}
                onClick={onResetBracket}
              >
                Reset Bracket
              </Button>
            )}

            <Button
              size="sm"
              loading={generatingBracket}
              disabled={generatingBracket || hasBracketMatches}
              title={
                hasBracketMatches
                  ? "Reset the bracket first"
                  : editableTeams.length < 2
                  ? "Enroll at least 2 teams first"
                  : ""
              }
              onClick={onGenerateBracket}
            >
              Generate Bracket
            </Button>
          </div>
        )}
      </div>

      {!readonly && bracketError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-800 dark:bg-red-900/20">
          {bracketError}
        </div>
      )}

      {!hasBracketMatches ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-gray-400 dark:border-gray-700">
          <p className="mb-2 text-2xl">🏆</p>
          <p className="font-medium">
            {readonly ? "Bracket not available yet" : "No bracket yet"}
          </p>
          <p className="mt-1 text-sm">
            {readonly
              ? "The knockout stage will appear here once it has been generated."
              : "Generate the bracket to start the knockout stage."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#20242a] bg-[#0d1015] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              {canPan ? "Drag to pan" : "Zoom in to pan around"}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#2e3440] bg-[#151922] text-sm text-slate-200 hover:bg-[#1b2130]"
                onClick={() => setZoom((z) => Math.max(0.9, +(z - 0.1).toFixed(2)))}
              >
                −
              </button>

              <button
                type="button"
                className="rounded-md border border-[#2e3440] bg-[#151922] px-3 py-1 text-xs font-medium text-slate-200 hover:bg-[#1b2130]"
                onClick={() => setZoom(1)}
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#2e3440] bg-[#151922] text-sm text-slate-200 hover:bg-[#1b2130]"
                onClick={() => setZoom((z) => Math.min(1.35, +(z + 0.1).toFixed(2)))}
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
                width: Math.max(scaledWidth, wrapperRef.current?.clientWidth ?? 0),
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
                  background: "linear-gradient(180deg, #0c0f14 0%, #090c11 100%)",
                }}
              >
                {mainPhases.map((phase) => {
                  const first = positionedMainMatches.find((m) => m.phase === phase);
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

                {positionedThirdPlaceMatches[0] && (
                  <RoundLabel
                    x={positionedThirdPlaceMatches[0].x}
                    y={positionedThirdPlaceMatches[0].y - 28}
                    title="3rd Place"
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
                    variant={item.phase === "final" ? "gold" : "default"}
                    onOpen={onOpenBracketEdit}
                    interactive={interactive}
                  />
                ))}

                {positionedThirdPlaceMatches.map((item) => (
                  <MatchCard
                    key={item.match.id}
                    item={item}
                    variant="bronze"
                    onOpen={onOpenBracketEdit}
                    interactive={interactive}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!readonly && onCloseBracketEdit && onSaveBracketEdit && (
        <BracketMatchEditModal
          open={!!editingBracketMatch}
          match={editingBracketMatch}
          teams={editableTeams}
          loading={bracketEditSaving}
          onClose={onCloseBracketEdit}
          onSave={onSaveBracketEdit}
        />
      )}
    </section>
  );
}