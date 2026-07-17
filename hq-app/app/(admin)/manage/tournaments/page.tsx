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
  Division,
} from "@/types";
import { GroupStageSettingsFields } from "@/components/tournament-detail/GroupStageSettingsFields";

const STATUS_OPTIONS = ["upcoming", "active", "completed"] as const;
const MANUAL_UNLIMITED = 9999;

const TYPE_OPTIONS = [
  { value: "round_robin", label: "Round Robin" },
  { value: "round_robin_classic", label: "Round Robin Classic" },
  { value: "bracket", label: "Bracket (Knockout)" },
  { value: "group_and_bracket", label: "Group Stage + Bracket" },
] as const;

const statusVariant: Record<string, "default" | "success" | "warning" | "muted"> = {
  upcoming: "warning",
  active: "default",
  completed: "muted",
};

type TournamentType = Tournament["type"];
type TournamentStatus = Tournament["status"];

type FormState = {
  name: string;
  date: string;
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
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  name: "",
  date: "",
  location: "",
  status: "upcoming",
  type: "round_robin",
  divisionId: "",
  managementMode: "auto",
  groupCount: "2",
  teamsPerGroup: "4",
  qualifiersPerGroup: "2",
  wildCardCount: "2",
  bracketSeedingRule: "crossover",
  thirdPlaceMatch: false,
};

export default function ManageTournamentsPage() {
  const { data, loading, error, refetch } = useFetch<Tournament[]>("/api/tournaments");
  const { data: divisions } = useFetch<Division[]>("/api/divisions");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .filter((t) => {
        if (divisionFilter === "all") return true;
        if (divisionFilter === "unassigned") return t.divisionId == null;
        return t.divisionId === Number(divisionFilter);
      });
  }, [data, search, divisionFilter]);

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
      divisionId: t.divisionId != null ? String(t.divisionId) : "",
      managementMode: t.managementMode ?? "auto",
      groupCount: String(fc.groupCount ?? 2),
      teamsPerGroup: String(fc.teamsPerGroup ?? 4),
      qualifiersPerGroup: String(fc.qualifiersPerGroup ?? 2),
      wildCardCount: String(fc.wildCardCount ?? 2),
      bracketSeedingRule: fc.bracketSeedingRule ?? "crossover",
      thirdPlaceMatch: fc.thirdPlaceMatch ?? false,
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

    if (form.type === "group_and_bracket" && form.managementMode === "auto") {
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

    const isKnockout = form.type === "bracket" || form.type === "group_and_bracket";

    const body: CreateTournamentBody | UpdateTournamentBody = {
      name: form.name,
      date: form.date,
      location: form.location,
      status: form.status,
      type: form.type,
      divisionId: form.divisionId ? Number(form.divisionId) : null,
      ...(form.type === "group_and_bracket" && {
        managementMode: form.managementMode,
      }),
      ...(isKnockout && {
        formatConfig: {
          ...(form.type === "group_and_bracket" && {
            groupCount:
              form.managementMode === "manual"
                ? MANUAL_UNLIMITED
                : parseInt(form.groupCount || "0", 10),
            teamsPerGroup:
              form.managementMode === "manual"
                ? MANUAL_UNLIMITED
                : parseInt(form.teamsPerGroup || "0", 10),
            qualifiersPerGroup:
              form.managementMode === "manual"
                ? 2
                : parseInt(form.qualifiersPerGroup || "0", 10),
            wildCardCount:
              form.managementMode === "manual"
                ? 0
                : parseInt(form.wildCardCount || "0", 10),
            bracketSeedingRule: form.bracketSeedingRule,
          }),
          thirdPlaceMatch: form.thirdPlaceMatch,
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

      <div className="space-y-3">
        <input
          type="search"
          placeholder="Search tournaments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDivisionFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              divisionFilter === "all"
                ? "bg-teal-700 text-white border-teal-700"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            All
          </button>

          {divisions?.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDivisionFilter(String(d.id))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                divisionFilter === String(d.id)
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {d.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setDivisionFilter("unassigned")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              divisionFilter === "unassigned"
                ? "bg-teal-700 text-white border-teal-700"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Unassigned
          </button>
        </div>
      </div>

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
                <th className="px-4 py-3 text-left">Division</th>
                <th className="px-4 py-3 text-left">Format</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
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
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {t.division?.name ?? "—"}
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
              value={form.name}
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
              value={form.date}
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
              value={form.location}
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
          </div>

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

          {(form.type === "bracket" ||
            (form.type === "group_and_bracket" && form.managementMode === "auto")) && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-0.5">
                <label
                  htmlFor="thirdPlaceMatch"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Play a 3rd place match
                </label>
                <p className="text-xs text-gray-400">
                  Losers of the semifinals will play each other for 3rd place
                </p>
              </div>

              <button
                type="button"
                id="thirdPlaceMatch"
                role="switch"
                aria-checked={form.thirdPlaceMatch}
                onClick={() => setField("thirdPlaceMatch", !form.thirdPlaceMatch)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                  form.thirdPlaceMatch ? "bg-teal-600" : "bg-gray-200 dark:bg-gray-700"
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