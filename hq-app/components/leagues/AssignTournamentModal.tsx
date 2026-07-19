"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import type { Tournament } from "@/types";

type AssignTournamentModalProps = {
  open: boolean;
  selectedTournamentId: string;
  tournaments: Tournament[];
  assigningSaving: boolean;
  inputCls: string;
  onClose: () => void;
  onChangeTournament: (value: string) => void;
  onAssign: () => void;
};

export function AssignTournamentModal({
  open,
  selectedTournamentId,
  tournaments,
  assigningSaving,
  inputCls,
  onClose,
  onChangeTournament,
  onAssign,
}: AssignTournamentModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Assign Tournament">
      <div className="px-5 py-4">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Only unassigned tournaments are shown. To move a tournament between leagues, remove it
            from the other league first.
          </p>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tournament
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => onChangeTournament(e.target.value)}
              className={inputCls}
            >
              <option value="">Select tournament...</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {formatDate(t.date)}
                </option>
              ))}
            </select>

            {tournaments.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                No unassigned tournaments available
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={assigningSaving}
              disabled={!selectedTournamentId}
              onClick={onAssign}
            >
              Assign
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}