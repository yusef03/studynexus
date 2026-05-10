"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useAdminUniversity } from "@/hooks/admin/useAdminUniversities";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminMutate } from "@/lib/adminFetch";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
import { Button } from "@/components/ui/button";
import type { AdminUniversity, AdminFaculty } from "@/types/admin";
import { useRouter } from "next/navigation";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5 space-y-1">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2.5 border-b last:border-0">
      <dt className="text-xs font-medium text-muted-foreground sm:w-36 shrink-0">{label}</dt>
      <dd className="text-sm">{value ?? "—"}</dd>
    </div>
  );
}

interface Props { params: { id: string } }

export default function AdminUniversityDetailPage({ params }: Props) {
  const { id } = params;
  const t = useTranslations("admin.universities");
  const tc = useTranslations("admin.common");
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const { token: adminToken, isActive } = useAdminSession();

  const { data: uni, isLoading, error } = useAdminUniversity(id);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AdminUniversity>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [addFacultyOpen, setAddFacultyOpen] = useState(false);
  const [facultyForm, setFacultyForm] = useState({ name: "", kuerzel: "" });
  const [facultySaving, setFacultySaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openEdit() {
    if (!uni) return;
    setEditForm({ name: uni.name, kuerzel: uni.kuerzel, stadt: uni.stadt, bundesland: uni.bundesland, typ: uni.typ });
    setSaveMsg(null);
    setEditOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await adminMutate<AdminUniversity>(`universities/${id}`, "PATCH", { body: editForm });
      qc.invalidateQueries({ queryKey: ["admin-university", id] });
      qc.invalidateQueries({ queryKey: ["admin-universities"] });
      setSaveMsg({ ok: true, text: tc("saved") });
      setEditOpen(false);
    } catch {
      setSaveMsg({ ok: false, text: tc("saveError") });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddFaculty() {
    if (!facultyForm.name.trim()) return;
    setFacultySaving(true);
    try {
      await adminMutate<AdminFaculty>("faculties", "POST", { body: { university_id: id, ...facultyForm } });
      qc.invalidateQueries({ queryKey: ["admin-university", id] });
      setAddFacultyOpen(false);
      setFacultyForm({ name: "", kuerzel: "" });
    } finally {
      setFacultySaving(false);
    }
  }

  async function handleDeleteFaculty(facultyId: string) {
    if (!adminToken) return;
    await adminMutate(`faculties/${facultyId}`, "DELETE", { adminToken });
    qc.invalidateQueries({ queryKey: ["admin-university", id] });
  }

  async function handleDeleteUni() {
    if (!adminToken) return;
    setDeleteLoading(true);
    try {
      await adminMutate(`universities/${id}`, "DELETE", { adminToken });
      qc.invalidateQueries({ queryKey: ["admin-universities"] });
      router.push(`/${locale}/admin/universities`);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !uni) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">{t("detail.notFound")}</p>
        <Link href={`/${locale}/admin/universities`} className="text-sm underline mt-2 inline-block">
          {t("detail.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl">
      {/* Back + heading */}
      <div>
        <Link href={`/${locale}/admin/universities`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t("detail.back")}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{uni.name}</h1>
          <Button size="sm" variant="outline" onClick={openEdit}>{tc("edit")}</Button>
        </div>
        {saveMsg && (
          <p className={`text-xs mt-1 ${saveMsg.ok ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
            {saveMsg.text}
          </p>
        )}
      </div>

      {/* Info */}
      <SectionCard title={t("detail.infoSection")}>
        <dl>
          <InfoRow label={t("detail.name")} value={uni.name} />
          <InfoRow label={t("detail.kuerzel")} value={uni.kuerzel} />
          <InfoRow label={t("detail.stadt")} value={uni.stadt} />
          <InfoRow label={t("detail.bundesland")} value={uni.bundesland} />
          <InfoRow label={t("detail.typ")} value={uni.typ} />
        </dl>
      </SectionCard>

      {/* Faculties */}
      <SectionCard title={t("detail.facultiesSection")}>
        {uni.faculties.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t("detail.noFaculties")}</p>
        ) : (
          <div className="space-y-1">
            {uni.faculties.map((fac) => (
              <div key={fac.id} className="flex items-center gap-3 py-2.5 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fac.name}</p>
                  <p className="text-xs text-muted-foreground">{fac.kuerzel}</p>
                </div>
                {isActive && (
                  <button
                    onClick={() => handleDeleteFaculty(fac.id)}
                    className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title={t("detail.colFacultyActions")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={() => setAddFacultyOpen(true)}>
            {t("detail.addFaculty")}
          </Button>
        </div>
      </SectionCard>

      {/* Danger zone */}
      {uni.faculties.length === 0 && (
        <SectionCard title={t("detail.deleteUni")}>
          <p className="text-xs text-muted-foreground mb-3">{t("detail.deleteUniDesc")}</p>
          {!isActive && <p className="text-xs text-red-500 mb-3">{tc("noSession")}</p>}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={!isActive}
          >
            {tc("delete")}
          </Button>
        </SectionCard>
      )}

      {/* Edit Modal */}
      <AdminFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("form.editTitle")}
        onSubmit={handleSave}
        loading={saving}
      >
        <div className="space-y-3">
          {(["name", "kuerzel", "stadt", "bundesland"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <label className="text-sm font-medium">{t(`form.${k}`)}</label>
              <input
                type="text"
                value={(editForm as Record<string, string>)[k] ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, [k]: e.target.value }))}
                placeholder={t(`form.${k}Placeholder`)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("form.typ")}</label>
            <select
              value={editForm.typ ?? "FH"}
              onChange={(e) => setEditForm((f) => ({ ...f, typ: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="FH">{t("form.fh")}</option>
              <option value="Uni">{t("form.uni")}</option>
            </select>
          </div>
        </div>
      </AdminFormModal>

      {/* Add Faculty Modal */}
      <AdminFormModal
        open={addFacultyOpen}
        onClose={() => { setAddFacultyOpen(false); setFacultyForm({ name: "", kuerzel: "" }); }}
        title={t("facultyForm.createTitle")}
        onSubmit={handleAddFaculty}
        loading={facultySaving}
        submitVariant="create"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("facultyForm.name")}</label>
            <input
              type="text"
              value={facultyForm.name}
              onChange={(e) => setFacultyForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("facultyForm.namePlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("facultyForm.kuerzel")}</label>
            <input
              type="text"
              value={facultyForm.kuerzel}
              onChange={(e) => setFacultyForm((f) => ({ ...f, kuerzel: e.target.value }))}
              placeholder={t("facultyForm.kuerzelPlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </AdminFormModal>

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteUni}
        entityName={uni.name}
        loading={deleteLoading}
      />
    </div>
  );
}
