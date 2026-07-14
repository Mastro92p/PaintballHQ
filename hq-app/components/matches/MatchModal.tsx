"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export const MAX_BODIES = 3;
export const MIN_BODIES = -3;

export type MatchForm = {
  teamAId: string
  teamBId: string
  scoreA: string
  scoreB: string
  bodyCountA: string
  bodyCountB: string
  round: string
  label: string
  field: string
}

export type MatchFormErrors = {
  teamAId?: string
  teamBId?: string
  scoreA?: string
  scoreB?: string
  bodyCountA?: string
  bodyCountB?: string
  round?: string
  label?: string
  field?: string
}

export const emptyMatchForm: MatchForm = {
  teamAId: "",
  teamBId: "",
  scoreA: "",
  scoreB: "",
  bodyCountA: "",
  bodyCountB: "",
  round: "",
  label: "",
  field: "",
}

type Team = {
  id: number;
  name: string;
};

function selectCls(hasError?: boolean) {
  return `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
    hasError
      ? "border-red-400 dark:border-red-500"
      : "border-gray-200 dark:border-gray-700"
  }`;
}

function inputCls(hasError?: boolean) {
  return `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
    hasError
      ? "border-red-400 dark:border-red-500"
      : "border-gray-200 dark:border-gray-700"
  }`;
}

const threeColGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  gap: "0.75rem",
  alignItems: "end",
};

type MatchModalProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  loading: boolean;
  isClassic: boolean;
  requireTeams?: boolean;
  teams: Team[];
  form: MatchForm;
  errors: MatchFormErrors;
  setForm: React.Dispatch<React.SetStateAction<MatchForm>>;
  setErrors: React.Dispatch<React.SetStateAction<MatchFormErrors>>;
  onClose: () => void;
  onSubmit: () => void;
};

export default function MatchModal({
  open,
  title,
  submitLabel,
  loading,
  isClassic,
  requireTeams = false,
  teams,
  form,
  errors,
  setForm,
  setErrors,
  onClose,
  onSubmit,
}: MatchModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-5"
      >
        <div style={threeColGrid}>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Team A {requireTeams && <span className="text-red-400">*</span>}
            </label>
            <select
              value={form.teamAId}
              onChange={(e) => {
                setForm({ ...form, teamAId: e.target.value });
                if (errors.teamAId) setErrors((p) => ({ ...p, teamAId: undefined }));
              }}
              className={selectCls(!!errors.teamAId)}
            >
              <option value="">Select team...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} disabled={String(t.id) === form.teamBId}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.teamAId && <p className="text-xs text-red-500">{errors.teamAId}</p>}
          </div>

          <div className="flex items-center justify-center pb-2">
            <span className="text-sm font-bold text-gray-400 dark:text-gray-500">VS</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Team B {requireTeams && <span className="text-red-400">*</span>}
            </label>
            <select
              value={form.teamBId}
              onChange={(e) => {
                setForm({ ...form, teamBId: e.target.value });
                if (errors.teamBId) setErrors((p) => ({ ...p, teamBId: undefined }));
              }}
              className={selectCls(!!errors.teamBId)}
            >
              <option value="">Select team...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} disabled={String(t.id) === form.teamAId}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.teamBId && <p className="text-xs text-red-500">{errors.teamBId}</p>}
          </div>
        </div>

        <div style={threeColGrid}>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Score A{" "}
              <span className="text-gray-400 font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <input
              type="number"
              min="0"
              value={form.scoreA}
              onChange={(e) => setForm({ ...form, scoreA: e.target.value })}
              className={inputCls()}
              placeholder="—"
            />
          </div>

          <div className="flex items-center justify-center pb-2">
            <span className="text-sm font-bold text-gray-300 dark:text-gray-600">–</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Score B{" "}
              <span className="text-gray-400 font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <input
              type="number"
              min="0"
              value={form.scoreB}
              onChange={(e) => setForm({ ...form, scoreB: e.target.value })}
              className={inputCls()}
              placeholder="—"
            />
          </div>
        </div>

        {isClassic && (
          <div style={threeColGrid}>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Bodies A{" "}
                <span className="text-gray-400 font-normal normal-case tracking-normal">
                  ({MIN_BODIES} to {MAX_BODIES})
                </span>
              </label>
              <input
                type="number"
                min={MIN_BODIES}
                max={MAX_BODIES}
                value={form.bodyCountA}
                onChange={(e) => setForm({ ...form, bodyCountA: e.target.value })}
                className={inputCls()}
                placeholder="—"
              />
            </div>

            <div className="flex items-center justify-center pb-2">
              <span className="text-sm font-bold text-gray-300 dark:text-gray-600">–</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Bodies B{" "}
                <span className="text-gray-400 font-normal normal-case tracking-normal">
                  ({MIN_BODIES} to {MAX_BODIES})
                </span>
              </label>
              <input
                type="number"
                min={MIN_BODIES}
                max={MAX_BODIES}
                value={form.bodyCountB}
                onChange={(e) => setForm({ ...form, bodyCountB: e.target.value })}
                className={inputCls()}
                placeholder="—"
              />
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-gray-700" />

        <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Label{" "}
            <span className="text-gray-400 font-normal normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => {
              setForm({ ...form, label: e.target.value });
              if (errors.label) setErrors((p) => ({ ...p, label: undefined }));
            }}
            className={inputCls(!!errors.label)}
            placeholder="e.g. Final, Quarter Final, Round of 32"
          />
          {errors.label && <p className="text-xs text-red-500">{errors.label}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Round{" "}
              <span className="text-gray-400 font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <input
              type="number"
              min="1"
              value={form.round}
              onChange={(e) => {
                setForm({ ...form, round: e.target.value });
                if (errors.round) setErrors((p) => ({ ...p, round: undefined }));
              }}
              className={inputCls(!!errors.round)}
              placeholder="e.g. 1"
            />
            {errors.round && <p className="text-xs text-red-500">{errors.round}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Field{" "}
              <span className="text-gray-400 font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={form.field}
              onChange={(e) => setForm({ ...form, field: e.target.value })}
              className={inputCls()}
              placeholder="e.g. Field 1"
            />
          </div>
        </div>
      </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}