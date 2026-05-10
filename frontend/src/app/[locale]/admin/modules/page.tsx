"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAdminModules } from "@/hooks/admin/useAdminModules";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminModule } from "@/types/admin";

type Filter = "all" | "active" | "archived";

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

export default function AdminModulesPage() {
  const t = useTranslations("admin.modules");
  const router = useRouter();
  const locale = useLocale();

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const { data: modules = [], isLoading } = useAdminModules({ include_archived: true });

  const filtered = useMemo(() => {
    return modules.filter((m) => {
      if (filter === "active" && m.is_archived) return false;
      if (filter === "archived" && !m.is_archived) return false;
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || (m.kuerzel ?? "").toLowerCase().includes(q);
    });
  }, [modules, filter, search]);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "active", label: t("filterActive") },
    { key: "archived", label: t("filterArchived") },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
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

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t("searchPlaceholder")}</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground w-24">{t("colKuerzel")}</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">{t("colName")}</th>
                  <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground w-16">{t("colEcts")}</th>
                  <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground w-14 hidden sm:table-cell">{t("colSem")}</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground w-28 hidden sm:table-cell">{t("colTyp")}</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground w-16 hidden md:table-cell">{t("colPA")}</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground w-20">{t("colStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((mod) => (
                  <tr
                    key={mod.id}
                    onClick={() => router.push(`/${locale}/admin/modules/${mod.id}`)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{mod.kuerzel ?? "—"}</td>
                    <td className="py-3 px-4 font-medium">{mod.name}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{mod.ects}</td>
                    <td className="py-3 px-4 text-right tabular-nums hidden sm:table-cell">
                      {mod.semester_empfehlung ?? "—"}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <ModulTypBadge typ={mod.modul_typ} />
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      {mod.pruefungsart ?? "—"}
                    </td>
                    <td className="py-3 px-4">
                      {mod.is_archived ? <StatusBadge status="archived" /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
