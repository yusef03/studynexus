"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useAdminModule } from "@/hooks/admin/useAdminModules";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminMutate } from "@/lib/adminFetch";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { ArchiveDialog } from "@/components/admin/ArchiveDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import type { AdminModule, AdminPrerequisite } from "@/types/admin";

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
      <dt className="text-xs font-medium text-muted-foreground sm:w-44 shrink-0">{label}</dt>
      <dd className="text-sm">{value ?? "—"}</dd>
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

const EMPTY_EDIT = {
  name: "", kuerzel: "", ects: "5", semester_empfehlung: "",
  modul_typ: "PFLICHT" as AdminModule["modul_typ"],
  ist_benotet: true, max_versuche: "3", gewichtung: "1",
  has_prerequisites: false, pruefungsart: "", sws: "",
};

const EMPTY_PREREQ = {
  prerequisite_type: "MODULE" as AdminPrerequisite["prerequisite_type"],
  description: "",
  required_module_id: "",
  minimum_ects: "",
  required_semesters: "",
};

interface Props { params: { id: string } }

export default function AdminModuleDetailPage({ params }: Props) {
  const { id } = params;
  const t = useTranslations("admin.modules");
  const tp = useTranslations("admin.prerequisites");
  const tc = useTranslations("admin.common");
  const locale = useLocale();
  const qc = useQueryClient();
  const { token: adminToken, isActive } = useAdminSession();

  const { data: mod, isLoading, error } = useAdminModule(id);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editSaving, setEditSaving] = useState(false);

  const [prereqOpen, setPrereqOpen] = useState(false);
  const [prereqForm, setPrereqForm] = useState(EMPTY_PREREQ);
  const [prereqSaving, setPrereqSaving] = useState(false);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  function openEdit() {
    if (!mod) return;
    setEditForm({
      name: mod.name,
      kuerzel: mod.kuerzel ?? "",
      ects: String(mod.ects),
      semester_empfehlung: mod.semester_empfehlung ? String(mod.semester_empfehlung) : "",
      modul_typ: mod.modul_typ,
      ist_benotet: mod.ist_benotet,
      max_versuche: String(mod.max_versuche),
      gewichtung: String(mod.gewichtung),
      has_prerequisites: mod.has_prerequisites,
      pruefungsart: mod.pruefungsart ?? "",
      sws: mod.sws ? String(mod.sws) : "",
    });
    setEditOpen(true);
  }

  async function handleEditSave() {
    setEditSaving(true);
    try {
      await adminMutate<AdminModule>(`modules/${id}`, "PATCH", {
        body: {
          name: editForm.name,
          kuerzel: editForm.kuerzel || null,
          ects: parseInt(editForm.ects) || 5,
          semester_empfehlung: editForm.semester_empfehlung ? parseInt(editForm.semester_empfehlung) : null,
          modul_typ: editForm.modul_typ,
          ist_benotet: editForm.ist_benotet,
          max_versuche: parseInt(editForm.max_versuche) || 3,
          gewichtung: parseFloat(editForm.gewichtung) || 1,
          has_prerequisites: editForm.has_prerequisites,
          pruefungsart: editForm.pruefungsart || null,
          sws: editForm.sws ? parseInt(editForm.sws) : null,
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-module", id] });
      setEditOpen(false);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleAddPrereq() {
    if (!prereqForm.description.trim()) return;
    setPrereqSaving(true);
    try {
      await adminMutate<AdminPrerequisite>("prerequisites", "POST", {
        body: {
          module_id: id,
          prerequisite_type: prereqForm.prerequisite_type,
          description: prereqForm.description,
          required_module_id: prereqForm.required_module_id || null,
          minimum_ects: prereqForm.minimum_ects ? parseFloat(prereqForm.minimum_ects) : null,
          required_semesters: prereqForm.required_semesters
            ? (() => { try { return JSON.parse(prereqForm.required_semesters); } catch { return null; } })()
            : null,
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-module", id] });
      setPrereqOpen(false);
      setPrereqForm(EMPTY_PREREQ);
    } finally {
      setPrereqSaving(false);
    }
  }

  async function handleDeletePrereq(prereqId: string) {
    if (!adminToken) return;
    await adminMutate(`prerequisites/${prereqId}`, "DELETE", { adminToken });
    qc.invalidateQueries({ queryKey: ["admin-module", id] });
  }

  async function handleArchive(reason: string) {
    if (!adminToken) return;
    setArchiveLoading(true);
    try {
      await adminMutate(`modules/${id}/archive`, "POST", { body: { reason }, adminToken });
      qc.invalidateQueries({ queryKey: ["admin-module", id] });
      setArchiveOpen(false);
    } finally {
      setArchiveLoading(false);
    }
  }

  async function handleRestore() {
    if (!adminToken) return;
    await adminMutate(`modules/${id}/restore`, "POST", { adminToken });
    qc.invalidateQueries({ queryKey: ["admin-module", id] });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !mod) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">{t("detail.notFound")}</p>
        <Link href={`/${locale}/admin/modules`} className="text-sm underline mt-2 inline-block">
          {t("detail.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl">
      {/* Back + heading */}
      <div>
        <Link
          href={`/${locale}/admin/exam-regulations/${mod.exam_regulation_id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("detail.back")}
        </Link>
        <div className="flex items-start justify-between gap-3 mt-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {mod.kuerzel && (
                <span className="font-mono text-sm text-muted-foreground">{mod.kuerzel}</span>
              )}
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{mod.name}</h1>
              <ModulTypBadge typ={mod.modul_typ} />
              {mod.is_archived && <StatusBadge status="archived" />}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("detail.students", { count: mod.student_count })}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={openEdit} className="shrink-0">
            {tc("edit")}
          </Button>
        </div>
      </div>

      {/* Info */}
      <SectionCard title={t("detail.infoSection")}>
        <dl>
          <InfoRow label={t("detail.name")} value={mod.name} />
          <InfoRow label={t("detail.kuerzel")} value={mod.kuerzel} />
          <InfoRow label={t("detail.ects")} value={`${mod.ects} ECTS`} />
          <InfoRow label={t("detail.semEmpfehlung")} value={mod.semester_empfehlung ?? "—"} />
          <InfoRow label={t("detail.modulTyp")} value={<ModulTypBadge typ={mod.modul_typ} />} />
          <InfoRow label={t("detail.istBenotet")} value={mod.ist_benotet ? tc("yes") : tc("no")} />
          <InfoRow label={t("detail.maxVersuche")} value={mod.max_versuche} />
          <InfoRow label={t("detail.gewichtung")} value={mod.gewichtung} />
          <InfoRow label={t("detail.pruefungsart")} value={mod.pruefungsart} />
          <InfoRow label={t("detail.sws")} value={mod.sws} />
          <InfoRow label={t("detail.hasPrereqs")} value={mod.has_prerequisites ? tc("yes") : tc("no")} />
        </dl>
      </SectionCard>

      {/* Prerequisites */}
      <SectionCard title={t("detail.prereqSection")}>
        {mod.prerequisites.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t("detail.noPrereqs")}</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground w-28">{t("detail.colPrereqType")}</th>
                  <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground">{t("detail.colPrereqDesc")}</th>
                  <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground w-16 hidden sm:table-cell">{t("detail.colPrereqEcts")}</th>
                  <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground w-20 hidden sm:table-cell">{t("detail.colPrereqSems")}</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {mod.prerequisites.map((prereq) => (
                  <tr key={prereq.id} className="border-b last:border-0">
                    <td className="py-2.5 px-1">
                      <PrereqTypeBadge type={prereq.prerequisite_type} t={tp} />
                    </td>
                    <td className="py-2.5 px-1 text-muted-foreground">{prereq.description}</td>
                    <td className="py-2.5 px-1 text-right tabular-nums hidden sm:table-cell">
                      {prereq.minimum_ects ?? "—"}
                    </td>
                    <td className="py-2.5 px-1 font-mono text-xs hidden sm:table-cell">
                      {prereq.required_semesters
                        ? JSON.stringify(prereq.required_semesters)
                        : "—"}
                    </td>
                    <td className="py-2.5 px-1 text-right">
                      {isActive && (
                        <button
                          onClick={() => handleDeletePrereq(prereq.id)}
                          className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title={t("detail.deletePrereq")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={() => setPrereqOpen(true)}>
            {tp("form.createTitle")}
          </Button>
        </div>
      </SectionCard>

      {/* Archive / Restore */}
      <SectionCard title={mod.is_archived ? tc("restore") : t("detail.archiveBtn")}>
        {!isActive && <p className="text-xs text-red-500 mb-3">{tc("noSession")}</p>}
        {mod.is_archived ? (
          <div>
            {mod.archive_reason && (
              <p className="text-xs text-muted-foreground mb-3">{mod.archive_reason}</p>
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
            {t("detail.archiveBtn")}
          </Button>
        )}
      </SectionCard>

      {/* Edit Module Modal */}
      <AdminFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("form.editTitle")}
        onSubmit={handleEditSave}
        loading={editSaving}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">{t("form.name")}</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("form.namePlaceholder")}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("form.kuerzel")}</label>
              <input
                type="text"
                value={editForm.kuerzel}
                onChange={(e) => setEditForm((f) => ({ ...f, kuerzel: e.target.value }))}
                placeholder={t("form.kuerzelPlaceholder")}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("form.ects")}</label>
              <input
                type="number"
                min={1}
                value={editForm.ects}
                onChange={(e) => setEditForm((f) => ({ ...f, ects: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("form.semEmpfehlung")}</label>
              <input
                type="number"
                min={1}
                value={editForm.semester_empfehlung}
                onChange={(e) => setEditForm((f) => ({ ...f, semester_empfehlung: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("form.modulTyp")}</label>
              <select
                value={editForm.modul_typ}
                onChange={(e) => setEditForm((f) => ({ ...f, modul_typ: e.target.value as AdminModule["modul_typ"] }))}
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
                value={editForm.pruefungsart}
                onChange={(e) => setEditForm((f) => ({ ...f, pruefungsart: e.target.value }))}
                placeholder={t("form.pruefungsartPlaceholder")}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("form.maxVersuche")}</label>
              <input
                type="number"
                min={1}
                value={editForm.max_versuche}
                onChange={(e) => setEditForm((f) => ({ ...f, max_versuche: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("form.gewichtung")}</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={editForm.gewichtung}
                onChange={(e) => setEditForm((f) => ({ ...f, gewichtung: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("form.sws")}</label>
              <input
                type="number"
                min={0}
                value={editForm.sws}
                onChange={(e) => setEditForm((f) => ({ ...f, sws: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.ist_benotet}
                onChange={(e) => setEditForm((f) => ({ ...f, ist_benotet: e.target.checked }))}
                className="rounded border"
              />
              <span className="text-sm">{t("form.istBenotet")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.has_prerequisites}
                onChange={(e) => setEditForm((f) => ({ ...f, has_prerequisites: e.target.checked }))}
                className="rounded border"
              />
              <span className="text-sm">{t("form.hasPrereqs")}</span>
            </label>
          </div>
        </div>
      </AdminFormModal>

      {/* Add Prerequisite Modal */}
      <AdminFormModal
        open={prereqOpen}
        onClose={() => { setPrereqOpen(false); setPrereqForm(EMPTY_PREREQ); }}
        title={tp("form.createTitle")}
        onSubmit={handleAddPrereq}
        loading={prereqSaving}
        submitVariant="create"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{tp("form.type")}</label>
            <select
              value={prereqForm.prerequisite_type}
              onChange={(e) => setPrereqForm((f) => ({ ...f, prerequisite_type: e.target.value as AdminPrerequisite["prerequisite_type"] }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="MODULE">{tp("typeModule")}</option>
              <option value="ECTS_THRESHOLD">{tp("typeEcts")}</option>
              <option value="SEMESTER_COMPLETE">{tp("typeSemester")}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{tp("form.description")}</label>
            <input
              type="text"
              value={prereqForm.description}
              onChange={(e) => setPrereqForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={tp("form.descriptionPlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {prereqForm.prerequisite_type === "MODULE" && (
            <div className="space-y-1">
              <label className="text-sm font-medium">{tp("form.requiredModuleId")}</label>
              <input
                type="text"
                value={prereqForm.required_module_id}
                onChange={(e) => setPrereqForm((f) => ({ ...f, required_module_id: e.target.value }))}
                placeholder="UUID"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
          {prereqForm.prerequisite_type === "ECTS_THRESHOLD" && (
            <div className="space-y-1">
              <label className="text-sm font-medium">{tp("form.minimumEcts")}</label>
              <input
                type="number"
                min={0}
                value={prereqForm.minimum_ects}
                onChange={(e) => setPrereqForm((f) => ({ ...f, minimum_ects: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
          {prereqForm.prerequisite_type === "SEMESTER_COMPLETE" && (
            <div className="space-y-1">
              <label className="text-sm font-medium">{tp("form.requiredSemesters")}</label>
              <input
                type="text"
                value={prereqForm.required_semesters}
                onChange={(e) => setPrereqForm((f) => ({ ...f, required_semesters: e.target.value }))}
                placeholder={tp("form.requiredSemestersPlaceholder")}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </div>
      </AdminFormModal>

      <ArchiveDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        entityName={mod.name}
        loading={archiveLoading}
      />
    </div>
  );
}

function PrereqTypeBadge({
  type,
  t,
}: {
  type: AdminPrerequisite["prerequisite_type"];
  t: ReturnType<typeof useTranslations>;
}) {
  const labels: Record<string, string> = {
    MODULE: t("typeModule"),
    ECTS_THRESHOLD: t("typeEcts"),
    SEMESTER_COMPLETE: t("typeSemester"),
  };
  const colors: Record<string, string> = {
    MODULE: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    ECTS_THRESHOLD: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    SEMESTER_COMPLETE: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  };
  return (
    <span className={`text-[10px] rounded-full px-1.5 py-px font-medium ${colors[type] ?? ""}`}>
      {labels[type] ?? type}
    </span>
  );
}
