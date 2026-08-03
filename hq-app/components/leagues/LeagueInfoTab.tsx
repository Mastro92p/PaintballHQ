"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { LeagueDetail, LeagueFormState } from "@/types";

type LeagueInfoTabProps = {
  league: LeagueDetail;
  assignedDivisions: { id: number; name: string }[];
  infoEditing: boolean;
  infoForm: LeagueFormState;
  infoSaving: boolean;
  inputCls: string;
  onEdit: () => void;
  onCancel: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onChange: (patch: Partial<LeagueFormState>) => void;
};

export function LeagueInfoTab({
  league,
  assignedDivisions,
  infoEditing,
  infoForm,
  infoSaving,
  inputCls,
  onEdit,
  onCancel,
  onSubmit,
  onChange,
}: LeagueInfoTabProps) {
  return (
    <section className="space-y-4 max-w-md">
      {!infoEditing ? (
        <>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
              {[
                { label: "Name", value: league.name },
                { label: "Description", value: league.description ?? "—" },
                { label: "Logo URL", value: league.logoUrl ?? "—" },
                { label: "Tournaments", value: league.tournaments.length },
                { label: "Teams", value: league.teams.length },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {row.value}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between py-2.5">
                <span className="text-gray-500 dark:text-gray-400">Divisions</span>
                <div className="flex flex-wrap gap-1.5 justify-end max-w-[240px]">
                  {assignedDivisions.length === 0 ? (
                    <span className="font-medium text-gray-900 dark:text-gray-100">—</span>
                  ) : (
                    assignedDivisions.map((d) => (
                      <span
                        key={d.id}
                        className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800"
                      >
                        {d.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={onEdit}>
            Edit Info
          </Button>
        </>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={infoForm.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className={inputCls}
              placeholder="League name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={infoForm.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className={inputCls}
              rows={3}
              placeholder="Short description..."
            />
          </div>



          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" loading={infoSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}