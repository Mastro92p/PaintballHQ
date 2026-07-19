"use client";

import { useState, useMemo, useEffect } from "react";
import { useFetch } from "@/hooks/use-fetch";
import type {
  League,
  CreateLeagueBody,
  UpdateLeagueBody,
  LeagueFormState,
  LeagueFormErrors,
} from "@/types";
import { handleMissingEntity } from "@/lib/handle-missing-entity";
import { SearchInput } from "@/components/ui/SearchInput";
import { ManageLeaguesHeader } from "@/components/leagues/ManageLeaguesHeader";
import { LeaguesTable } from "@/components/leagues/LeaguesTable";
import { LeagueFormModal } from "@/components/leagues/LeagueFormModal";


const emptyForm: LeagueFormState = { name: "", description: "", logoUrl: "" };

export default function ManageLeaguesPage() {
  const { data, loading, error } = useFetch<League[]>("/api/leagues");

  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<League | null>(null);
  const [form, setForm] = useState<LeagueFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<LeagueFormErrors>({});
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState<number | null>(null);
  const [search, setSearch]           = useState("");
  const [localLeagues, setLocalLeagues] = useState<League[]>([]);

  useEffect(() => {
    if (!data) return;
    setLocalLeagues((prev) => (prev.length === 0 ? data : prev));
  }, [data]);

  const filtered = useMemo(() => {
    return localLeagues.filter((l) =>
      l.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [localLeagues, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(l: League) {
    setEditing(l);
    setForm({
      name:        l.name,
      description: l.description ?? "",
      logoUrl:     l.logoUrl ?? "",
    });
    setFormErrors({});
    setModalOpen(true);
  }

  async function reloadLeagues() {
    const res = await fetch("/api/leagues");
    if (!res.ok) throw new Error("Failed to reload leagues");

    const fresh: League[] = await res.json();
    setLocalLeagues(fresh);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
  }

  function validate(): boolean {
    const errors: LeagueFormErrors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);

    const body: CreateLeagueBody | UpdateLeagueBody = {
      name: form.name,
      description: form.description || undefined,
      logoUrl: form.logoUrl || undefined,
    };

    try {
      let savedLeague: League;

      if (editing) {
        const res = await fetch(`/api/leagues/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const result = await res.json().catch(() => null);

        if (
          await handleMissingEntity(res, {
            entityName: "league",
            action: "update",
            reload: reloadLeagues,
            onMissing: closeModal,
          })
        ) {
          return;
        }

        if (!res.ok) {
          throw new Error(result?.error ?? "Failed to update league");
        }

        savedLeague = {
          ...editing,
          ...(result?.league ?? result ?? {}),
          ...body,
        } as League;

        setLocalLeagues((prev) =>
          prev.map((l) => (l.id === savedLeague.id ? savedLeague : l))
        );
      } else {
        const res = await fetch("/api/leagues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const result = await res.json().catch(() => null);

        if (
          await handleMissingEntity(res, {
            entityName: "league",
            action: "update",
            reload: reloadLeagues,
            onMissing: closeModal,
          })
        ) {
          return;
        }

        if (!res.ok) {
          throw new Error(result?.error ?? "Failed to create league");
        }

        savedLeague = {
          ...(result?.league ?? result),
          ...body,
        } as League;

        setLocalLeagues((prev) => [...prev, savedLeague]);
      }

      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this league? All associated tournaments will be unlinked.")) return;

    const previous = localLeagues;
    setDeleting(id);
    setLocalLeagues((prev) => prev.filter((l) => l.id !== id));

    try {
      const res = await fetch(`/api/leagues/${id}`, { method: "DELETE" });

      if (
        await handleMissingEntity(res, {
          entityName: "league",
          action: "delete",
          reload: reloadLeagues,
        })
      ) {
        return;
      }

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(result?.error ?? "Failed to delete league");
      }
    } catch (err) {
      console.error(err);
      setLocalLeagues(previous);
    } finally {
      setDeleting(null);
    }
  }

  function inputCls(field: keyof LeagueFormState) {
    return `w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-gray-900 ${
      formErrors[field]
        ? "border-red-400 dark:border-red-500"
        : "border-gray-200 dark:border-gray-700"
    }`;
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <ManageLeaguesHeader onCreate={openCreate} />

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search leagues..."
      />


      <LeaguesTable
        leagues={filtered}
        loading={loading}
        error={error}
        deleting={deleting}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {/* Modal */}
      <LeagueFormModal
        open={modalOpen}
        editing={editing}
        form={form}
        errors={formErrors}
        saving={saving}
        inputCls={inputCls}
        onClose={closeModal}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onClearError={(field) =>
          setFormErrors((prev) => ({ ...prev, [field]: undefined }))
        }
      />
    </main>
  );
}