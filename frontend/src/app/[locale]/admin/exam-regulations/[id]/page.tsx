"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAdminExamReg, useAdminModules } from "@/hooks/admin/useAdminModules";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminMutate } from "@/lib/adminFetch";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { ArchiveDialog } from "@/components/admin/ArchiveDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import type { AdminModule } from "@/types/admin";

type ModuleFilter = "all" | "active" | "archived";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2.5 border-b last:border-0">
      <dt className="text-xs font-medium text-muted-foreground sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm">{value ?? "—"}</dd>
    </div>
  );
}

const EMPTY_MODULE = {
  name: "", kuerzel: "", ects: "5", semester_empfehlung: "",
  modul_typ: "PFLICHT" as AdminModule["modul_typ"], ist_benotet: true, max_versuche: "3",
  gewichtung: "1", has_prerequisites: false, pruefungsart: "", sws: "",
};

interface Props { params: { id: string } }

export default function AdminExamRegDetailPage({ params }: Props) {
  const { id } = params;
  const t = useTranslations("admin.examRegs");
  const tm = useTranslations("admin.modules");
  const tc = useTranslations("admin.common");
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const { token: adminToken, isActive } = useAdminSession();

  const { data: er, isLoading: erLoading, error: erError } = useAdminExamReg(id);
  const { data: modules = [], isLoading: modLoading } = useAdminModules({
    exam_regulation_id: id,
    include_archived: true,
  });

  // ── filter state ──
  const [filter, setFilter] = useState<ModuleFilter>("all");
  const [search, setSearch] = useState("");

  // ── edit ER modal ──
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ version: "", gueltig_ab: "", ist_aktuell: false });
  const [editSaving, setEditSaving] = useState(false);

  // ── add module modal ──
  const [addModOpen, setAddModOpen] = useState(false);
  const [modForm, setModForm] = useState(EMPTY_MODULE);
  const [modSaving, setModSaving] = useState(false);

  // ── JSON import modal ──
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importSaving, setImportSaving] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // ── archive / restore ──
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      if (filter === "active" && m.is_archived) return false;
      if (filter === "archived" && !m.is_archived) return false;
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || (m.kuerzel ?? "").toLowerCase().includes(q);
    });
  }, [modules, filter, search]);

  function openEdit() {
    if (!er) return;
    setEditForm({ version: er.version, gueltig_ab: er.gueltig_ab ?? "", ist_aktuell: er.ist_aktuell });
    setEditOpen(true);
  }

  async function handleEditSave() {
    setEditSaving(true);
    try {
      await adminMutate(`exam-regulations/${id}`, "PATCH", {
        body: {
          version: editForm.version,
          gueltig_ab: editForm.gueltig_ab || null,
          ist_aktuell: editForm.ist_aktuell,
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-exam-reg", id] });
      setEditOpen(false);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleAddModule() {
    if (!modForm.name.trim()) return;
    setModSaving(true);
    try {
      await adminMutate<AdminModule>("modules", "POST", {
        body: {
          exam_regulation_id: id,
          name: modForm.name,
          kuerzel: modForm.kuerzel || null,
          ects: parseInt(modForm.ects) || 5,
          semester_empfehlung: modForm.semester_empfehlung ? parseInt(modForm.semester_empfehlung) : null,
          modul_typ: modForm.modul_typ,
          ist_benotet: modForm.ist_benotet,
          max_versuche: parseInt(modForm.max_versuche) || 3,
          gewichtung: parseFloat(modForm.gewichtung) || 1,
          has_prerequisites: modForm.has_prerequisites,
          pruefungsart: modForm.pruefungsart || null,
          sws: modForm.sws ? parseInt(modForm.sws) : null,
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-modules", id, true] });
      qc.invalidateQueries({ queryKey: ["admin-exam-reg", id] });
      setAddModOpen(false);
      setModForm(EMPTY_MODULE);
    } finally {
      setModSaving(false);
    }
  }

  async function handleJsonImport() {
    setImportError(null);
    setImportResult(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(importJson);
    } catch {
      setImportError("Invalid JSON");
      return;
    }
    if (!Array.isArray(parsed)) {
      setImportError("Expected a JSON array");
      return;
    }
    setImportSaving(true);
    try {
      const result = await adminMutate<{ created: number; skipped: number; errors: string[] }>(
        "modules/import/json", "POST",
        { body: { exam_regulation_id: id, modules: parsed } }
      );
      setImportResult(result ?? null);
      qc.invalidateQueries({ queryKey: ["admin-modules", id, true] });
      qc.invalidateQueries({ queryKey: ["admin-exam-reg", id] });
      setImportJson("");
    } finally {
      setImportSaving(false);
    }
  }

  async function handleArchive(reason: string) {
    if (!adminToken) return;
    setArchiveLoading(true);
    try {
      await adminMutate(`exam-regulations/${id}/archive`, "POST", { body: { reason }, adminToken });
      qc.invalidateQueries({ queryKey: ["admin-exam-reg", id] });
      setArchiveOpen(false);
    } finally {
      setArchiveLoading(false);
    }
  }

  async function handleRestore() {
    if (!adminToken) return;
    await adminMutate(`exam-regulations/${id}/restore`, "POST", { adminToken });
    qc.invalidateQueries({ queryKey: ["admin-exam-reg", id] });
  }

  if (erLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (erError || !er) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">{t("notFound")}</p>
        <button onClick={() => router.back()} className="text-sm underline mt-2 inline-block">
          {t("back")}
        </button>
      </div>
    );
  }

  const filterTabs: { key: ModuleFilter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "active", label: t("filterActive") },
    { key: "archived", label: t("filterArchived") },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl">
      {/* Back + heading */}
      <div>
        <Link
          href={`/${locale}/admin/programs/${er.program_id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("back")}
        </Link>
        <div className="flex items-start justify-between gap-3 mt-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{er.version}</h1>
              {er.ist_aktuell && (
                <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-1.5 py-px font-medium">
                  {t("istAktuell")}
                </span>
              )}
              {er.is_archived && <StatusBadge status="archived" />}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("moduleCount", { count: er.module_count })}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={openEdit} className="shrink-0">
            {tc("edit")}
          </Button>
        </div>
      </div>

      {/* Info */}
      <SectionCard title={t("infoSection")}>
        <dl>
          <InfoRow label={t("version")} value={er.version} />
          <InfoRow label={t("gueltigAb")} value={er.gueltig_ab ?? "—"} />
          <InfoRow
            label={t("istAktuell")}
            value={er.ist_aktuell ? tc("yes") : tc("no")}
          />
          <InfoRow
            label={t("programLabel")}
            value={
              <Link
                href={`/${locale}/admin/programs/${er.program_id}`}
                className="text-sm underline text-muted-foreground hover:text-foreground"
              >
                {er.program_id}
              </Link>
            }
          />
        </dl>
      </SectionCard>

      {/* Module Catalog */}
      <SectionCard title={tm("title")}>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex gap-1.5">
            {filterTabs.map((tab) => (
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
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              {t("jsonImport")}
            </Button>
            <Button size="sm" onClick={() => setAddModOpen(true)}>
              {t("addModule")}
            </Button>
          </div>
        </div>

        {/* Module list */}
        {modLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-md border bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : filteredModules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t("noModules")}</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground w-24">{t("colKuerzel")}</th>
                  <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground">{t("colName")}</th>
                  <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground w-14">{t("colEcts")}</th>
                  <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground w-14 hidden sm:table-cell">{t("colSem")}</th>
                  <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground w-24 hidden sm:table-cell">{t("colTyp")}</th>
                  <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground w-16 hidden md:table-cell">{t("colPA")}</th>
                  <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground w-20">{t("colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredModules.map((mod) => (
                  <tr
                    key={mod.id}
                    onClick={() => router.push(`/${locale}/admin/modules/${mod.id}`)}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-1 font-mono text-xs text-muted-foreground">{mod.kuerzel ?? "—"}</td>
                    <td className="py-2.5 px-1 font-medium">{mod.name}</td>
                    <td className="py-2.5 px-1 text-right tabular-nums">{mod.ects}</td>
                    <td className="py-2.5 px-1 text-right tabular-nums hidden sm:table-cell">{mod.semester_empfehlung ?? "—"}</td>
                    <td className="py-2.5 px-1 hidden sm:table-cell">
                      <ModulTypBadge typ={mod.modul_typ} />
                    </td>
                    <td className="py-2.5 px-1 hidden md:table-cell text-muted-foreground">{mod.pruefungsart ?? "—"}</td>
                    <td className="py-2.5 px-1">
                      {mod.is_archived ? <StatusBadge status="archived" /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Archive / Restore */}
      <SectionCard title={er.is_archived ? tc("restore") : t("archiveEr")}>
        {!isActive && <p className="text-xs text-red-500 mb-3">{tc("noSession")}</p>}
        {er.is_archived ? (
          <div>
            {er.archive_reason && (
              <p className="text-xs text-muted-foreground mb-3">{er.archive_reason}</p>
            )}
            <Button size="sm" variant="outline" onClick={handleRestore} disabled={!isActive}>
              {tc("restore")}
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => setArchiveOpen(true)}
            disabled={!isActive}
          >
            {t("archiveEr")}
          </Button>
        )}
      </SectionCard>

      {/* Edit ER Modal */}
      <AdminFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("form.editTitle")}
        onSubmit={handleEditSave}
        loading={editSaving}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("form.version")}</label>
            <input
              type="text"
              value={editForm.version}
              onChange={(e) => setEditForm((f) => ({ ...f, version: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("form.gueltigAb")}</label>
            <input
              type="text"
              value={editForm.gueltig_ab}
              onChange={(e) => setEditForm((f) => ({ ...f, gueltig_ab: e.target.value }))}
              placeholder={t("form.gueltigAbPlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.ist_aktuell}
              onChange={(e) => setEditForm((f) => ({ ...f, ist_aktuell: e.target.checked }))}
              className="rounded border"
            />
            <span className="text-sm">{t("form.istAktuell")}</span>
          </label>
        </div>
      </AdminFormModal>

      {/* Add Module Modal */}
      <AdminFormModal
        open={addModOpen}
        onClose={() => { setAddModOpen(false); setModForm(EMPTY_MODULE); }}
        title={tm("form.createTitle")}
        onSubmit={handleAddModule}
        loading={modSaving}
        submitVariant="create"
      >
        <ModuleFormFields form={modForm} onChange={setModForm} t={tm} />
      </AdminFormModal>

      {/* JSON Import Modal */}
      <AdminFormModal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportResult(null); setImportError(null); setImportJson(""); }}
        title={t("jsonImportTitle")}
        onSubmit={handleJsonImport}
        loading={importSaving}
        submitVariant="create"
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t("jsonImportDesc")}</p>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder={t("jsonImportPlaceholder")}
            rows={8}
            className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          {importError && <p className="text-xs text-red-500">{importError}</p>}
          {importResult && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {t("jsonImportResult", { created: importResult.created, skipped: importResult.skipped })}
              {importResult.errors.length > 0 && (
                <span className="text-red-500 ml-2">({importResult.errors.length} errors)</span>
              )}
            </p>
          )}
        </div>
      </AdminFormModal>

      <ArchiveDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        entityName={er.version}
        loading={archiveLoading}
      />
    </div>
  );
}

function ModulTypBadge({ typ }: { typ: AdminModule["modul_typ"] }) {
  const colors: Record<string, string> = {
    PFLICHT: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    WAHLPFLICHT: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    ERGAENZEND: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  };
  return (
    <span className={`text-[10px] rounded-full px-1.5 py-px font-medium ${colors[typ] ?? ""}`}>
      {typ}
    </span>
  );
}

interface ModuleFormFieldsProps {
  form: typeof EMPTY_MODULE;
  onChange: React.Dispatch<React.SetStateAction<typeof EMPTY_MODULE>>;
  t: ReturnType<typeof useTranslations>;
}

function ModuleFormFields({ form, onChange, t }: ModuleFormFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">{t("form.name")}</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange((f) => ({ ...f, name: e.target.value }))}
            placeholder={t("form.namePlaceholder")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("form.kuerzel")}</label>
          <input
            type="text"
            value={form.kuerzel}
            onChange={(e) => onChange((f) => ({ ...f, kuerzel: e.target.value }))}
            placeholder={t("form.kuerzelPlaceholder")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("form.ects")}</label>
          <input
            type="number"
            min={1}
            value={form.ects}
            onChange={(e) => onChange((f) => ({ ...f, ects: e.target.value }))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("form.semEmpfehlung")}</label>
          <input
            type="number"
            min={1}
            value={form.semester_empfehlung}
            onChange={(e) => onChange((f) => ({ ...f, semester_empfehlung: e.target.value }))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("form.modulTyp")}</label>
          <select
            value={form.modul_typ}
            onChange={(e) => onChange((f) => ({ ...f, modul_typ: e.target.value as typeof form.modul_typ }))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="PFLICHT">{t("form.pflicht")}</option>
            <option value="WAHLPFLICHT">{t("form.wahlpflicht")}</option>
            <option value="ERGAENZEND">{t("form.ergaenzend")}</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("form.pruefungsart")}</label>
          <input
            type="text"
            value={form.pruefungsart}
            onChange={(e) => onChange((f) => ({ ...f, pruefungsart: e.target.value }))}
            placeholder={t("form.pruefungsartPlaceholder")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("form.maxVersuche")}</label>
          <input
            type="number"
            min={1}
            value={form.max_versuche}
            onChange={(e) => onChange((f) => ({ ...f, max_versuche: e.target.value }))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("form.gewichtung")}</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={form.gewichtung}
            onChange={(e) => onChange((f) => ({ ...f, gewichtung: e.target.value }))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("form.sws")}</label>
          <input
            type="number"
            min={0}
            value={form.sws}
            onChange={(e) => onChange((f) => ({ ...f, sws: e.target.value }))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.ist_benotet}
            onChange={(e) => onChange((f) => ({ ...f, ist_benotet: e.target.checked }))}
            className="rounded border"
          />
          <span className="text-sm">{t("form.istBenotet")}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.has_prerequisites}
            onChange={(e) => onChange((f) => ({ ...f, has_prerequisites: e.target.checked }))}
            className="rounded border"
          />
          <span className="text-sm">{t("form.hasPrereqs")}</span>
        </label>
      </div>
    </div>
  );
}
