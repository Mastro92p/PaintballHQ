"use client";

import { useState, useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type {
  Tournament,
  CreateTournamentBody,
  UpdateTournamentBody,
  FormatConfig,
} from "@/types";

const STATUS_OPTIONS = ["upcoming", "active", "completed"] as const;

const TYPE_OPTIONS = [
  { value: "round_robin", label: "Round Robin" },
  { value: "bracket", label: "Bracket (Knockout)" },
  { value: "group_and_bracket", label: "Group Stage + Bracket" },
] as const;

const SEEDING_OPTIONS = [
  { value: "crossover", label: "Crossover (A1 vs B2, B1 vs A2)" },
  { value: "sequential", label: "Sequential (A1 vs B1, A2 vs B2)" },
] as const;

const statusVariant: Record<
  string,
  "default" | "success" | "warning" | "muted"
> = {
  upcoming: "warning",
  active: "default",
  completed: "muted",
};

type FormState = {
  name: string;
  date: string;
  location: string;
  status: string;
  type: string;
  groupCount: string;
  teamsPerGroup: string;
  qualifiersPerGroup: string;
  wildCardCount: string;
  bracketSeedingRule: FormatConfig["bracketSeedingRule"];
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  name: "",
  date: "",
  location: "",
  status: "upcoming",
  type: "round_robin",
  groupCount: "2",
  teamsPerGroup: "4",
  qualifiersPerGroup: "2",
  wildCardCount: "2",
  bracketSeedingRule: "crossover",
};

export default function ManageTournamentsPage() {
  const { data, loading, error, refetch } = useFetch<Tournament[]>("/api/tournaments");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const groupCount = parseInt(form.groupCount || "0", 10);
  const teamsPerGroup = parseInt(form.teamsPerGroup || "0", 10);
  const qualifiersPerGroup = parseInt(form.qualifiersPerGroup || "0", 10);
  const wildCardCount = parseInt(form.wildCardCount || "0", 10);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(t: Tournament) {
    setEditing(t);

    const fc = (t.formatConfig ?? {}) as Partial<FormatConfig>;

    setForm({
      name: t.name ?? "",
      date: t.date?.slice(0, 10) ?? "",
      location: t.location ?? "",
      status: t.status ?? "upcoming",
      type: t.type ?? "round_robin",
      groupCount: String(fc.groupCount ?? 2),
      teamsPerGroup: String(fc.teamsPerGroup ?? 4),
      qualifiersPerGroup: String(fc.qualifiersPerGroup ?? 2),
      wildCardCount: String(fc.wildCardCount ?? 2),
      bracketSeedingRule: fc.bracketSeedingRule ?? "crossover",
    });

    setFormErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm({ ...emptyForm });
    setFormErrors({});
  }

  function validate(): boolean {
    const errors: FormErrors = {};

    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.date) errors.date = "Date is required";
    if (!form.location.trim()) errors.location = "Location is required";

    if (form.type === "group_and_bracket") {
      if (!form.groupCount || parseInt(form.groupCount, 10) < 2) {
        errors.groupCount = "At least 2 groups required";
      }

      if (!form.teamsPerGroup || parseInt(form.teamsPerGroup, 10) < 2) {
        errors.teamsPerGroup = "At least 2 teams per group";
      }

      if (!form.qualifiersPerGroup || parseInt(form.qualifiersPerGroup, 10) < 1) {
        errors.qualifiersPerGroup = "At least 1 qualifier per group";
      }

      if (
        parseInt(form.qualifiersPerGroup || "0", 10) >=
        parseInt(form.teamsPerGroup || "0", 10)
      ) {
        errors.qualifiersPerGroup = "Must be less than teams per group";
      }

      if (parseInt(form.wildCardCount || "0", 10) < 0) {
        errors.wildCardCount = "Wild cards cannot be negative";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);

    const body: CreateTournamentBody | UpdateTournamentBody = {
      name: form.name,
      date: form.date,
      location: form.location,
      status: form.status as Tournament["status"],
      type: form.type,
      ...(form.type === "group_and_bracket" && {
        formatConfig: {
          groupCount: parseInt(form.groupCount || "0", 10),
          teamsPerGroup: parseInt(form.teamsPerGroup || "0", 10),
          qualifiersPerGroup: parseInt(form.qualifiersPerGroup || "0", 10),
          wildCardCount: parseInt(form.wildCardCount || "0", 10),
          bracketSeedingRule: form.bracketSeedingRule,
        },
      }),
    };

    try {
      if (editing) {
        await fetch(`/api/tournaments/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/tournaments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      closeModal();
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this tournament?")) return;

    setDeleting(id);
    try {
      await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
      refetch();
    } finally {
      setDeleting(null);
    }
  }

  function inputCls(field: keyof FormState) {
    return `w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
      formErrors[field]
        ? "border-red-400 dark:border-red-500"
        : "border-gray-200 dark:border-gray-700"
    }`;
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tournaments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage tournaments
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="self-start sm:self-auto whitespace-nowrap px-4 py-2"
        >
          + New Tournament
        </Button>
      </div>

      <input
        type="search"
        placeholder="Search tournaments..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:max-w-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
      />

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Format</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No tournaments found
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {t.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {t.location ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">
                      {(t.type ?? "round_robin").replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[t.status] ?? "muted"}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/manage/tournaments/${t.id}`}>
                          <Button variant="ghost" size="sm">
                            Manage →
                          </Button>
                        </Link>

                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                          Edit
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          loading={deleting === t.id}
                          onClick={() => handleDelete(t.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Tournament" : "New Tournament"}
        size="lg"
      >
        <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4 pb-4"
          >
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              className={inputCls("name")}
              placeholder="Tournament name"
            />
            {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.date ?? ""}
              onChange={(e) => setField("date", e.target.value)}
              className={inputCls("date")}
            />
            {formErrors.date && <p className="text-xs text-red-500">{formErrors.date}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              value={form.location ?? ""}
              onChange={(e) => setField("location", e.target.value)}
              className={inputCls("location")}
              placeholder="City, Venue"
            />
            {formErrors.location && (
              <p className="text-xs text-red-500">{formErrors.location}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Format
            </label>
            <select
              value={form.type ?? ""}
              onChange={(e) => setField("type", e.target.value)}
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
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Group Stage Settings
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Number of groups <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={form.groupCount ?? ""}
                    onChange={(e) => setField("groupCount", e.target.value)}
                    className={inputCls("groupCount")}
                    placeholder="2"
                  />
                  {formErrors.groupCount && (
                    <p className="text-xs text-red-500">{formErrors.groupCount}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Teams per group <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={form.teamsPerGroup ?? ""}
                    onChange={(e) => setField("teamsPerGroup", e.target.value)}
                    className={inputCls("teamsPerGroup")}
                    placeholder="4"
                  />
                  {formErrors.teamsPerGroup && (
                    <p className="text-xs text-red-500">{formErrors.teamsPerGroup}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Qualifiers per group <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.qualifiersPerGroup ?? ""}
                  onChange={(e) => setField("qualifiersPerGroup", e.target.value)}
                  className={inputCls("qualifiersPerGroup")}
                  placeholder="2"
                />
                {formErrors.qualifiersPerGroup && (
                  <p className="text-xs text-red-500">{formErrors.qualifiersPerGroup}</p>
                )}
                <p className="text-xs text-gray-400">
                  Top N teams from each group advance to the bracket
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wild cards
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.wildCardCount ?? ""}
                  onChange={(e) => setField("wildCardCount", e.target.value)}
                  className={inputCls("wildCardCount")}
                  placeholder="2"
                />
                {formErrors.wildCardCount && (
                  <p className="text-xs text-red-500">{formErrors.wildCardCount}</p>
                )}
                <p className="text-xs text-gray-400">
                  Extra best-performing teams across all groups that also advance
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bracket seeding
                </label>
                <select
                  value={form.bracketSeedingRule ?? "crossover"}
                  onChange={(e) =>
                    setField(
                      "bracketSeedingRule",
                      e.target.value as FormatConfig["bracketSeedingRule"]
                    )
                  }
                  className={inputCls("bracketSeedingRule")}
                >
                  {SEEDING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400">
                  How group winners are matched up in the first knockout round
                </p>
              </div>

              <div className="rounded-md bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 px-3 py-2 text-xs text-teal-700 dark:text-teal-300">
                {groupCount} groups × {teamsPerGroup} teams ={" "}
                <strong>{groupCount * teamsPerGroup} total teams</strong>
                {" · "}
                <strong>{groupCount * qualifiersPerGroup + wildCardCount} advance</strong>
                {" "}to the bracket
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={form.status ?? ""}
              onChange={(e) => setField("status", e.target.value)}
              className={inputCls("status")}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="sticky bottom-0 -mx-5 mt-4 px-5 py-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save Changes" : "Create Tournament"}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}