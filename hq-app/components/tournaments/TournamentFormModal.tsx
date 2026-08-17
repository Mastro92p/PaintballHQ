"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { GroupStageSettingsFields } from "@/components/tournament-detail/GroupStageSettingsFields";
import type { FormatConfig, Division, Tournament } from "@/types";

const STATUS_OPTIONS = ["upcoming", "active", "completed", "to_check"] as const;

const TYPE_OPTIONS = [
  { value: "round_robin", label: "Round Robin" },
  { value: "round_robin_classic", label: "Round Robin Classic" },
  { value: "bracket", label: "Bracket (Knockout)" },
  { value: "group_and_bracket", label: "Group Stage + Bracket" },
] as const;

const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  upcoming: "Upcoming",
  active: "Active",
  completed: "Completed",
  to_check: "To check",
};

type TournamentType = Tournament["type"];
type TournamentStatus = Tournament["status"];

export type TournamentFormState = {
  name: string;
  date: string;
  time: string;
  location: string;
  status: TournamentStatus;
  type: TournamentType;
  divisionId: string;
  managementMode: "auto" | "manual";
  groupCount: string;
  teamsPerGroup: string;
  qualifiersPerGroup: string;
  wildCardCount: string;
  bracketSeedingRule: FormatConfig["bracketSeedingRule"];
  thirdPlaceMatch: boolean;
  isHidden: boolean;
  trackBodyCount: boolean;
};

export type TournamentFormErrors = Partial<Record<keyof TournamentFormState, string>>;

type TournamentFormModalProps = {
  open: boolean;
  editing: Tournament | null;
  form: TournamentFormState;
  formErrors: TournamentFormErrors;
  divisions?: Division[] | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  setField: <K extends keyof TournamentFormState>(
    key: K,
    value: TournamentFormState[K]
  ) => void;
  inputCls: (field: keyof TournamentFormState) => string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500">{message}</p>;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function TournamentFormModal({
  open,
  editing,
  form,
  formErrors,
  divisions,
  saving,
  onClose,
  onSubmit,
  setField,
  inputCls,
}: TournamentFormModalProps) {
  const showThirdPlaceMatch =
    form.type === "bracket" ||
    form.type === "group_and_bracket";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Tournament" : "New Tournament"}
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex max-h-[78vh] flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-5 pb-3">
            <Section title="Basics">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className={inputCls("name")}
                    placeholder="Tournament name"
                  />
                  <FieldError message={formErrors.name} />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                    className={inputCls("date")}
                  />
                  <FieldError message={formErrors.date} />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Time <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setField("time", e.target.value)}
                    className={inputCls("time")}
                  />
                  <FieldError message={formErrors.time} />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Division <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <select
                    value={form.divisionId}
                    onChange={(e) => setField("divisionId", e.target.value)}
                    className={inputCls("divisionId")}
                  >
                    <option value="">No division</option>
                    {divisions?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <FieldError message={formErrors.divisionId} />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    className={inputCls("location")}
                    placeholder="City, venue"
                  />
                  <FieldError message={formErrors.location} />
                </div>
              </div>
            </Section>

            <Section title="Format">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Format
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setField("type", e.target.value as TournamentType)}
                    className={inputCls("type")}
                  >
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {form.type === "group_and_bracket" && (
                  <GroupStageSettingsFields
                    form={form}
                    errors={formErrors}
                    setField={setField}
                    inputCls={inputCls}
                  />
                )}

                {showThirdPlaceMatch && (
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="space-y-0.5 pr-4">
                      <label
                        htmlFor="thirdPlaceMatch"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Play a 3rd place match
                      </label>
                      <p className="text-xs text-gray-400">
                        Losers of the semifinals will play each other for 3rd place.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="thirdPlaceMatch"
                      role="switch"
                      aria-checked={form.thirdPlaceMatch}
                      onClick={() => setField("thirdPlaceMatch", !form.thirdPlaceMatch)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                        form.thirdPlaceMatch
                          ? "bg-teal-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          form.thirdPlaceMatch ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="space-y-0.5 pr-4">
                    <label
                      htmlFor="trackBodyCount"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Track body count
                    </label>
                    <p className="text-xs text-gray-400">
                      Record body count for each team when entering match results.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="trackBodyCount"
                    role="switch"
                    aria-checked={form.trackBodyCount}
                    onClick={() => setField("trackBodyCount", !form.trackBodyCount)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                      form.trackBodyCount
                        ? "bg-teal-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        form.trackBodyCount ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

            </Section>

            <Section title="Status">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value as TournamentStatus)}
                    className={inputCls("status")}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <FieldError message={formErrors.status} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="space-y-0.5 pr-4">
                    <label
                      htmlFor="tournamentHidden"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Hidden from public
                    </label>
                    <p className="text-xs text-gray-400">
                      Hidden tournaments are visible only in admin and won’t appear on public pages.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="tournamentHidden"
                    role="switch"
                    aria-checked={form.isHidden}
                    onClick={() => setField("isHidden", !form.isHidden)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                      form.isHidden
                        ? "bg-teal-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        form.isHidden ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Section>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save Changes" : "Create Tournament"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}