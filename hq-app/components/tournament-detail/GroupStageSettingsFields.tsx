import type { FormatConfig } from "@/types";

const SEEDING_OPTIONS = [
  { value: "crossover", label: "Crossover (A1 vs B2, B1 vs A2)" },
  { value: "sequential", label: "Sequential (A1 vs B1, A2 vs B2)" },
] as const;

type GroupFormFields = {
  managementMode: "auto" | "manual";
  groupCount: string;
  teamsPerGroup: string;
  qualifiersPerGroup: string;
  wildCardCount: string;
  bracketSeedingRule: FormatConfig["bracketSeedingRule"];
};

type Props<F extends GroupFormFields> = {
  form: F;
  errors: Partial<Record<keyof F, string>>;
  setField: <K extends keyof F>(key: K, value: F[K]) => void;
  inputCls: (field: keyof F) => string;
};

export function GroupStageSettingsFields<F extends GroupFormFields>({
  form,
  errors,
  setField,
  inputCls,
}: Props<F>) {
  const groupCount = parseInt(form.groupCount || "0", 10);
  const teamsPerGroup = parseInt(form.teamsPerGroup || "0", 10);
  const qualifiersPerGroup = parseInt(form.qualifiersPerGroup || "0", 10);
  const wildCardCount = parseInt(form.wildCardCount || "0", 10);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        Group Stage Settings
      </p>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Group management
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setField("managementMode", "auto" as F["managementMode"])}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.managementMode === "auto"
                ? "bg-teal-700 text-white border-teal-700"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            ⚡ Automatic
          </button>
          <button
            type="button"
            onClick={() => setField("managementMode", "manual" as F["managementMode"])}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.managementMode === "manual"
                ? "bg-teal-700 text-white border-teal-700"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            ✋ Manual
          </button>
        </div>
        <p className="text-xs text-gray-400">
          {form.managementMode === "auto"
            ? "Groups and matches are generated automatically from enrolled teams"
            : "You manually assign teams to groups and create matches yourself"}
        </p>
      </div>

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
            onChange={(e) => setField("groupCount", e.target.value as F["groupCount"])}
            className={inputCls("groupCount")}
            placeholder="2"
          />
          {errors.groupCount && <p className="text-xs text-red-500">{errors.groupCount}</p>}
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
            onChange={(e) => setField("teamsPerGroup", e.target.value as F["teamsPerGroup"])}
            className={inputCls("teamsPerGroup")}
            placeholder="4"
          />
          {errors.teamsPerGroup && (
            <p className="text-xs text-red-500">{errors.teamsPerGroup}</p>
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
          onChange={(e) => setField("qualifiersPerGroup", e.target.value as F["qualifiersPerGroup"])}
          className={inputCls("qualifiersPerGroup")}
          placeholder="2"
        />
        {errors.qualifiersPerGroup && (
          <p className="text-xs text-red-500">{errors.qualifiersPerGroup}</p>
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
          onChange={(e) => setField("wildCardCount", e.target.value as F["wildCardCount"])}
          className={inputCls("wildCardCount")}
          placeholder="2"
        />
        {errors.wildCardCount && <p className="text-xs text-red-500">{errors.wildCardCount}</p>}
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
              e.target.value as F["bracketSeedingRule"]
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
        <strong>{groupCount * qualifiersPerGroup + wildCardCount} advance</strong> to the
        bracket
      </div>
    </div>
  );
}