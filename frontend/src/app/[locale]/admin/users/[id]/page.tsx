"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminUser } from "@/hooks/admin/useAdminUser";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminMutate } from "@/lib/adminFetch";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
import { Button } from "@/components/ui/button";
import type { AdminUserDetail } from "@/types/admin";

interface Props {
  params: { id: string };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2.5 border-b last:border-0">
      <dt className="text-xs font-medium text-muted-foreground sm:w-36 shrink-0">{label}</dt>
      <dd className="text-sm">{value ?? "—"}</dd>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5 space-y-1">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0 cursor-pointer">
      <span className="text-sm">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export default function AdminUserDetailPage({ params }: Props) {
  const { id } = params;
  const t = useTranslations("admin.users.detail");
  const router = useRouter();
  const currentLocale = useLocale();
  const qc = useQueryClient();
  const { token: adminToken, isActive } = useAdminSession();

  const { data: user, isLoading, error } = useAdminUser(id);

  const [patchLoading, setPatchLoading] = useState(false);
  const [notesValue, setNotesValue] = useState<string | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesMsg, setNotesMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const notes = notesValue !== null ? notesValue : (user?.admin_notes ?? "");

  async function handleToggle(field: "is_active" | "is_premium" | "is_verified", value: boolean) {
    if (!user) return;
    setPatchLoading(true);
    try {
      await adminMutate<AdminUserDetail>(`users/${id}`, "PATCH", { body: { [field]: value } });
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } finally {
      setPatchLoading(false);
    }
  }

  async function handleSaveNotes() {
    if (!user) return;
    setNotesSaving(true);
    setNotesMsg(null);
    try {
      await adminMutate<AdminUserDetail>(`users/${id}`, "PATCH", { body: { admin_notes: notes } });
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      setNotesMsg({ ok: true, text: t("notesSaved") });
    } catch {
      setNotesMsg({ ok: false, text: t("notesError") });
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!adminToken) return;
    setResetLoading(true);
    setResetMsg(null);
    try {
      await adminMutate(`users/${id}/reset-password`, "POST", { adminToken });
      setResetMsg({ ok: true, text: t("resetPasswordSuccess") });
    } catch {
      setResetMsg({ ok: false, text: t("resetPasswordError") });
    } finally {
      setResetLoading(false);
    }
  }

  async function handleDelete(reason: string) {
    if (!adminToken) return;
    setDeleteLoading(true);
    try {
      await adminMutate(`users/${id}`, "DELETE", { body: { reason }, adminToken });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      router.push(`/${currentLocale}/admin/users`);
    } catch {
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

  if (error || !user) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">{t("notFound")}</p>
        <Link href={`/${currentLocale}/admin/users`} className="text-sm underline mt-2 inline-block">
          {t("backToList")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl">
      {/* Back + heading */}
      <div>
        <Link href={`/${currentLocale}/admin/users`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t("backToList")}
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {user.full_name ?? user.email}
          </h1>
          {user.is_admin && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
              <ShieldCheck className="h-3 w-3" />
              {t("adminFlag")}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
      </div>

      {/* Personal data */}
      <SectionCard title={t("infoSection")}>
        <dl>
          <InfoRow label={t("email")} value={user.email} />
          <InfoRow label={t("matrikel")} value={user.matrikelnummer} />
          <InfoRow label={t("birthDate")} value={user.birth_date ? new Date(user.birth_date).toLocaleDateString(currentLocale) : null} />
          <InfoRow label={t("university")} value={user.university} />
          <InfoRow label={t("gpa")} value={user.gpa !== null ? user.gpa?.toFixed(2) : null} />
          <InfoRow label={t("language")} value={user.preferred_language?.toUpperCase()} />
          <InfoRow label={t("registeredAt")} value={new Date(user.created_at).toLocaleDateString(currentLocale)} />
          <InfoRow
            label={t("lastLogin")}
            value={user.last_login_at ? new Date(user.last_login_at).toLocaleDateString(currentLocale) : t("never")}
          />
        </dl>
      </SectionCard>

      {/* Study plan summary */}
      <SectionCard title={t("studySection")}>
        <dl>
          <InfoRow label={t("program")} value={user.program_name} />
          <InfoRow label={t("startSem")} value={user.start_semester} />
          <InfoRow label={t("totalModules")} value={user.total_modules} />
          <InfoRow label={t("passedModules")} value={user.passed_modules} />
          <InfoRow label={t("ects")} value={user.erreichte_ects} />
        </dl>
      </SectionCard>

      {/* Toggles */}
      <SectionCard title="Account-Status">
        <div>
          <Toggle
            label={t("toggleActive")}
            checked={user.is_active}
            onChange={(v) => handleToggle("is_active", v)}
            disabled={patchLoading}
          />
          <div className="space-y-1">
            <Toggle
              label={t("togglePremium")}
              checked={user.is_premium}
              onChange={(v) => handleToggle("is_premium", v)}
              disabled={patchLoading}
            />
            <p className="text-xs text-muted-foreground pl-3">{t("togglePremiumDesc")}</p>
          </div>
          <Toggle
            label={t("toggleVerified")}
            checked={user.is_verified}
            onChange={(v) => handleToggle("is_verified", v)}
            disabled={patchLoading}
          />
        </div>
      </SectionCard>

      {/* Admin notes */}
      <SectionCard title={t("notesSection")}>
        <textarea
          value={notes}
          onChange={(e) => { setNotesValue(e.target.value); setNotesMsg(null); }}
          placeholder={t("notesPlaceholder")}
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="flex items-center gap-3 mt-2">
          <Button size="sm" onClick={handleSaveNotes} disabled={notesSaving}>
            {notesSaving ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{t("savingNotes")}</>
            ) : t("saveNotes")}
          </Button>
          {notesMsg && (
            <span className={`text-xs ${notesMsg.ok ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
              {notesMsg.text}
            </span>
          )}
        </div>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title={t("dangerSection")}>
        <div className="space-y-4">
          {/* Reset password */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-3 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t("resetPassword")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("resetPasswordDesc")}</p>
              {!isActive && <p className="text-xs text-red-500 mt-1">{t("noSession")}</p>}
              {resetMsg && (
                <p className={`text-xs mt-1 ${resetMsg.ok ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                  {resetMsg.text}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetPassword}
              disabled={!isActive || resetLoading}
              className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/20"
            >
              {resetLoading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{t("resetPasswordLoading")}</>
              ) : t("resetPassword")}
            </Button>
          </div>

          {/* Delete user */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">{t("deleteUser")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("deleteUserDesc")}</p>
              {!isActive && <p className="text-xs text-red-500 mt-1">{t("noSession")}</p>}
            </div>
            <Button
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={!isActive}
              className="shrink-0 bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
            >
              {t("deleteUser")}
            </Button>
          </div>
        </div>
      </SectionCard>

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => handleDelete("Admin-initiated delete")}
        entityName={user.full_name ?? user.email}
        loading={deleteLoading}
      />
    </div>
  );
}
