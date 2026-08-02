import type { Team } from "@/types";
import { TeamsTransferTab } from "@/components/ui/TeamsTransferTab";

type Props = {
  localAvailable: Team[];
  localEnrolled: Team[];
  pendingEnrollChanges: boolean;
  bulkSaving: boolean;
  tournamentDivisionId: number | null;
  tournamentDivisionName: string | null;
  onMoveToEnrolled: (team: Team) => void;
  onMoveToAvailable: (team: Team) => void;
  onEnrollAll: () => void;
  onRemoveAll: () => void;
  onReset: () => void;
  onSave: () => void;
};

export function TeamsTab({
  localAvailable,
  localEnrolled,
  pendingEnrollChanges,
  bulkSaving,
  tournamentDivisionId,
  tournamentDivisionName,
  onMoveToEnrolled,
  onMoveToAvailable,
  onEnrollAll,
  onRemoveAll,
  onReset,
  onSave,
}: Props) {
  const isUnrestricted =
    tournamentDivisionId == null ||
    tournamentDivisionName?.trim().toLowerCase() === "open";

  const eligibleAvailable = isUnrestricted
    ? localAvailable
    : localAvailable.filter((t) => t.divisionId === tournamentDivisionId);

  const hiddenCount = localAvailable.length - eligibleAvailable.length;

  function enrollAllEligible() {
    eligibleAvailable.forEach((team) => onMoveToEnrolled(team));
  }

  return (
    <TeamsTransferTab
      availableTeams={eligibleAvailable}
      selectedTeams={localEnrolled}
      pendingChanges={pendingEnrollChanges}
      saving={bulkSaving}
      helperText={
        tournamentDivisionId != null && hiddenCount > 0
          ? `${hiddenCount} team${hiddenCount === 1 ? "" : "s"} hidden — not in this tournament's division`
          : null
      }
      emptyAvailableText={
        localAvailable.length === 0
          ? "All teams enrolled"
          : "No teams match this tournament's division"
      }
      emptySelectedText="No teams enrolled"
      onAddTeam={onMoveToEnrolled}
      onRemoveTeam={onMoveToAvailable}
      onAddAll={enrollAllEligible}
      onRemoveAll={onRemoveAll}
      onReset={onReset}
      onSave={onSave}
    />
  );
}