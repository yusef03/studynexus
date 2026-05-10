"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { useAdminPrograms } from "@/hooks/admin/useAdminPrograms";
import { adminMutate } from "@/lib/adminFetch";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import type { AdminProgram } from "@/types/admin";

type Filter = "all" | "active" | "archived";

const EMPTY = { name: "", abschluss: "", regelstudienzeit: "7", gesamt_ects: "210", faculty_id: "" };

export default function AdminProgramsPage() {
  const t = useTranslations("admin.programs");
  const router = useRouter();
  const locale = useLocale();
  const qc = useQueryClient();

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: programs = [], isLoading } = useAdminPrograms({
    include_archived: filter === "archived" || filter === "all",
  });

  const filtered = programs.filter((p) => {
    if (filter === "active" && p.is_archived) return false;
    if (filter === "archived" && !p.is_archived) return false;
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

  async function handleCreate() {
    if (!form.name.trim() || !form.faculty_id.trim()) return;
    setSaving(true);
    try {
      await adminMutate<AdminProgram>("programs", "POST", {
        body: {
          ...form,
          regelstudienzeit: parseInt(form.regelstudienzeit),
          gesamt_ects: parseInt(form.gesamt_ects),
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-programs"] });
      setModalOpen(false);
      setForm(EMPTY);
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "active", label: t("filterActive") },
    { key: "archived", label: t("filterArchived") },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)} className="self-start sm:self-auto">
          {t("create")}
        </Button>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filter === tab.key
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t("searchPlaceholder")}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((prog) => (
            <button
              key={prog.id}
              onClick={() => router.push(`/${locale}/admin/programs/${prog.id}`)}
              className="w-full flex items-center gap-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors px-4 py-3 text-left"
            >
              <GraduationCap className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{prog.name}</p>
                  {prog.is_archived && <StatusBadge status="archived" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {prog.abschluss} · {prog.gesamt_ects} ECTS · {prog.regelstudienzeit} Sem.
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">→</span>
            </button>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AdminFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm(EMPTY); }}
        title={t("form.createTitle")}
        onSubmit={handleCreate}
        loading={saving}
        submitVariant="create"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("form.name")}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("form.namePlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("form.abschluss")}</label>
            <input
              type="text"
              value={form.abschluss}
              onChange={(e) => setForm((f) => ({ ...f, abschluss: e.target.value }))}
              placeholder={t("form.abschlussPlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("form.regelstudienzeit")}</label>
              <input
                type="number"
                min={1}
                value={form.regelstudienzeit}
                onChange={(e) => setForm((f) => ({ ...f, regelstudienzeit: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("form.gesamtEcts")}</label>
              <input
                type="number"
                min={1}
                value={form.gesamt_ects}
                onChange={(e) => setForm((f) => ({ ...f, gesamt_ects: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("form.facultyId")}</label>
            <input
              type="text"
              value={form.faculty_id}
              onChange={(e) => setForm((f) => ({ ...f, faculty_id: e.target.value }))}
              placeholder={t("form.facultyIdPlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </AdminFormModal>
    </div>
  );
}
