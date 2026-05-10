"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useAdminUniversities } from "@/hooks/admin/useAdminUniversities";
import { adminMutate } from "@/lib/adminFetch";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { Button } from "@/components/ui/button";
import type { AdminUniversity } from "@/types/admin";

interface UniForm {
  name: string;
  kuerzel: string;
  stadt: string;
  bundesland: string;
  typ: string;
}

const EMPTY: UniForm = { name: "", kuerzel: "", stadt: "", bundesland: "", typ: "FH" };

export default function AdminUniversitiesPage() {
  const t = useTranslations("admin.universities");
  const router = useRouter();
  const locale = useLocale();
  const qc = useQueryClient();

  const { data: unis = [], isLoading } = useAdminUniversities();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<UniForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const filtered = unis.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.kuerzel.toLowerCase().includes(search.toLowerCase())
  );

  function field(key: keyof UniForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await adminMutate<AdminUniversity>("universities", "POST", { body: form });
      qc.invalidateQueries({ queryKey: ["admin-universities"] });
      setModalOpen(false);
      setForm(EMPTY);
    } finally {
      setSaving(false);
    }
  }

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

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full sm:max-w-sm rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t("searchPlaceholder")}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((uni) => (
            <button
              key={uni.id}
              onClick={() => router.push(`/${locale}/admin/universities/${uni.id}`)}
              className="w-full flex items-center gap-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors px-4 py-3 text-left"
            >
              <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{uni.name}</p>
                <p className="text-xs text-muted-foreground">{uni.kuerzel} · {uni.stadt} · {uni.typ}</p>
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
          {(["name", "kuerzel", "stadt", "bundesland"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <label className="text-sm font-medium">{t(`form.${k}`)}</label>
              <input
                type="text"
                value={form[k]}
                onChange={(e) => field(k, e.target.value)}
                placeholder={t(`form.${k}Placeholder`)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("form.typ")}</label>
            <select
              value={form.typ}
              onChange={(e) => field("typ", e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="FH">{t("form.fh")}</option>
              <option value="Uni">{t("form.uni")}</option>
            </select>
          </div>
        </div>
      </AdminFormModal>
    </div>
  );
}
