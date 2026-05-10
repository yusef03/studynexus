"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAdminProgram } from "@/hooks/admin/useAdminPrograms";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminMutate } from "@/lib/adminFetch";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { ArchiveDialog } from "@/components/admin/ArchiveDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import type { AdminProgram, AdminExamReg } from "@/types/admin";

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

interface Props { params: { id: string } }

export default function AdminProgramDetailPage({ params }: Props) {
  const { id } = params;
  const t = useTranslations("admin.programs");
  const tc = useTranslations("admin.common");
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const { token: adminToken, isActive } = useAdminSession();

  const { data: prog, isLoading, error } = useAdminProgram(id);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; abschluss: string; regelstudienzeit: string; gesamt_ects: string }>({
    name: "", abschluss: "", regelstudienzeit: "", gesamt_ects: "",
  });
  const [saving, setSaving] = useState(false);

  const [addErOpen, setAddErOpen] = useState(false);
  const [erForm, setErForm] = useState({ version: "", gueltig_ab: "", ist_aktuell: false });
  const [erSaving, setErSaving] = useState(false);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  function openEdit() {
    if (!prog) return;
    setEditForm({
      name: prog.name,
      abschluss: prog.abschluss,
      regelstudienzeit: String(prog.regelstudienzeit),
      gesamt_ects: String(prog.gesamt_ects),
    });
    setEditOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await adminMutate<AdminProgram>(`programs/${id}`, "PATCH", {
        body: {
          name: editForm.name,
          abschluss: editForm.abschluss,
          regelstudienzeit: parseInt(editForm.regelstudienzeit),
          gesamt_ects: parseInt(editForm.gesamt_ects),
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-program", id] });
      qc.invalidateQueries({ queryKey: ["admin-programs"] });
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddExamReg() {
    if (!erForm.version.trim()) return;
    setErSaving(true);
    try {
      await adminMutate<AdminExamReg>("exam-regulations", "POST", {
        body: {
          program_id: id,
          version: erForm.version,
          gueltig_ab: erForm.gueltig_ab || null,
          ist_aktuell: erForm.ist_aktuell,
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-program", id] });
      setAddErOpen(false);
      setErForm({ version: "", gueltig_ab: "", ist_aktuell: false });
    } finally {
      setErSaving(false);
    }
  }

  async function handleArchive(reason: string) {
    if (!adminToken) return;
    setArchiveLoading(true);
    try {
      await adminMutate(`programs/${id}/archive`, "POST", { body: { reason }, adminToken });
      qc.invalidateQueries({ queryKey: ["admin-program", id] });
      qc.invalidateQueries({ queryKey: ["admin-programs"] });
      setArchiveOpen(false);
    } finally {
      setArchiveLoading(false);
    }
  }

  async function handleRestore() {
    if (!adminToken) return;
    await adminMutate(`programs/${id}/restore`, "POST", { adminToken });
    qc.invalidateQueries({ queryKey: ["admin-program", id] });
    qc.invalidateQueries({ queryKey: ["admin-programs"] });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !prog) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">{t("detail.notFound")}</p>
        <Link href={`/${locale}/admin/programs`} className="text-sm underline mt-2 inline-block">
          {t("detail.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl">
      {/* Back + heading */}
      <div>
        <Link href={`/${locale}/admin/programs`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t("detail.back")}
        </Link>
        <div className="flex items-start justify-between gap-3 mt-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{prog.name}</h1>
              {prog.is_archived && <StatusBadge status="archived" />}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{prog.abschluss}</p>
          </div>
          <Button size="sm" variant="outline" onClick={openEdit} className="shrink-0">{tc("edit")}</Button>
        </div>
      </div>

      {/* Info */}
      <SectionCard title={t("detail.infoSection")}>
        <dl>
          <InfoRow label={t("detail.name")} value={prog.name} />
          <InfoRow label={t("detail.abschluss")} value={prog.abschluss} />
          <InfoRow label={t("detail.regelstudienzeit")} value={`${prog.regelstudienzeit} ${t("detail.semesterSuffix")}`} />
          <InfoRow label={t("detail.gesamtEcts")} value={`${prog.gesamt_ects} ECTS`} />
          <InfoRow label={t("detail.students")} value={t("detail.students", { count: prog.student_count })} />
        </dl>
      </SectionCard>

      {/* Exam Regulations */}
      <SectionCard title={t("detail.examRegsSection")}>
        {prog.exam_regulations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t("detail.noExamRegs")}</p>
        ) : (
          <div className="space-y-1">
            {prog.exam_regulations.map((er) => (
              <Link
                key={er.id}
                href={`/${locale}/admin/exam-regulations/${er.id}`}
                className="flex items-center gap-3 py-2.5 border-b last:border-0 hover:bg-muted/30 -mx-1 px-1 rounded transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{er.version}</p>
                    {er.ist_aktuell && (
                      <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-1.5 py-px font-medium">
                        {t("detail.istAktuell")}
                      </span>
                    )}
                    {er.is_archived && <StatusBadge status="archived" />}
                  </div>
                  {er.gueltig_ab && (
                    <p className="text-xs text-muted-foreground">{t("detail.colErDate")}: {er.gueltig_ab}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{t("detail.openEr")}</span>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={() => setAddErOpen(true)}>
            {t("detail.addExamReg")}
          </Button>
        </div>
      </SectionCard>

      {/* Archive / Restore */}
      <SectionCard title={prog.is_archived ? tc("restore") : tc("archive")}>
        {!isActive && <p className="text-xs text-red-500 mb-3">{tc("noSession")}</p>}
        {prog.is_archived ? (
          <div>
            {prog.archive_reason && (
              <p className="text-xs text-muted-foreground mb-3">Begründung: {prog.archive_reason}</p>
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
            {tc("archive")}
          </Button>
        )}
      </SectionCard>

      {/* Edit Modal */}
      <AdminFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("form.editTitle")}
        onSubmit={handleSave}
        loading={saving}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("form.name")}</label>
            <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("form.namePlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("form.abschluss")}</label>
            <input type="text" value={editForm.abschluss} onChange={(e) => setEditForm((f) => ({ ...f, abschluss: e.target.value }))}
              placeholder={t("form.abschlussPlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("form.regelstudienzeit")}</label>
              <input type="number" min={1} value={editForm.regelstudienzeit}
                onChange={(e) => setEditForm((f) => ({ ...f, regelstudienzeit: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("form.gesamtEcts")}</label>
              <input type="number" min={1} value={editForm.gesamt_ects}
                onChange={(e) => setEditForm((f) => ({ ...f, gesamt_ects: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>
      </AdminFormModal>

      {/* Add ExamReg Modal */}
      <AdminFormModal
        open={addErOpen}
        onClose={() => setAddErOpen(false)}
        title={t("examRegForm.createTitle")}
        onSubmit={handleAddExamReg}
        loading={erSaving}
        submitVariant="create"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("examRegForm.version")}</label>
            <input type="text" value={erForm.version} onChange={(e) => setErForm((f) => ({ ...f, version: e.target.value }))}
              placeholder={t("examRegForm.versionPlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("examRegForm.gueltigAb")}</label>
            <input type="text" value={erForm.gueltig_ab} onChange={(e) => setErForm((f) => ({ ...f, gueltig_ab: e.target.value }))}
              placeholder={t("examRegForm.gueltigAbPlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={erForm.ist_aktuell} onChange={(e) => setErForm((f) => ({ ...f, ist_aktuell: e.target.checked }))}
              className="rounded border" />
            <span className="text-sm">{t("examRegForm.istAktuell")}</span>
          </label>
        </div>
      </AdminFormModal>

      <ArchiveDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        entityName={prog.name}
        loading={archiveLoading}
      />
    </div>
  );
}
