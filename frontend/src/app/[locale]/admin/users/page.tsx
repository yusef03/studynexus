"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminUserListItem } from "@/types/admin";

type Filter = "all" | "active" | "inactive" | "premium" | "unverified";

const LIMIT = 25;

export default function AdminUsersPage() {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const locale = useLocale();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  function filterParams() {
    if (filter === "active") return { is_active: true };
    if (filter === "inactive") return { is_active: false };
    if (filter === "premium") return { is_premium: true };
    if (filter === "unverified") return { is_verified: false };
    return {};
  }

  const { data, isLoading } = useAdminUsers({
    page,
    search,
    limit: LIMIT,
    ...filterParams(),
  });

  function handleSearch(q: string) {
    setSearch(q);
    setPage(1);
  }

  function handleFilter(f: Filter) {
    setFilter(f);
    setPage(1);
  }

  const columns: Column<AdminUserListItem>[] = [
    {
      key: "user",
      header: t("colUser"),
      sortable: false,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium truncate text-sm">{row.full_name ?? row.email}</p>
          <p className="text-xs text-muted-foreground truncate">{row.email}</p>
        </div>
      ),
    },
    {
      key: "matrikelnummer",
      header: t("colMatrikel"),
      sortable: false,
      hideOnMobile: true,
      render: (row) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.matrikelnummer ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("colStatus"),
      sortable: false,
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge status={row.is_active ? "active" : "inactive"} />
          {row.is_premium && <StatusBadge status="premium" />}
          {!row.is_verified && <StatusBadge status="unverified" />}
        </div>
      ),
    },
    {
      key: "program",
      header: t("colProgram"),
      sortable: false,
      hideOnMobile: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground truncate max-w-[140px] block">
          {row.program_name ?? t("noProgram")}
        </span>
      ),
    },
    {
      key: "progress",
      header: t("colProgress"),
      sortable: false,
      hideOnMobile: true,
      render: (row) => (
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          <span>{t("modules", { passed: row.passed_modules, total: row.total_modules })}</span>
          <span className="ml-1 text-muted-foreground/60">· {t("ects", { count: row.erreichte_ects })}</span>
        </div>
      ),
    },
    {
      key: "last_login",
      header: t("colLastLogin"),
      sortable: false,
      hideOnMobile: true,
      render: (row) =>
        row.last_login_at ? (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(row.last_login_at).toLocaleDateString(locale)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{t("neverLoggedIn")}</span>
        ),
    },
    {
      key: "created_at",
      header: t("colJoined"),
      hideOnMobile: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString(locale)}
        </span>
      ),
    },
  ];

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "active", label: t("filterActive") },
    { key: "inactive", label: t("filterInactive") },
    { key: "premium", label: t("filterPremium") },
    { key: "unverified", label: t("filterUnverified") },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilter(tab.key)}
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

      {/* Table */}
      <AdminDataTable<AdminUserListItem>
        columns={columns}
        data={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        limit={LIMIT}
        loading={isLoading}
        onPageChange={setPage}
        onSearch={handleSearch}
        searchPlaceholder={t("searchPlaceholder")}
        onRowClick={(row) => router.push(`/${locale}/admin/users/${row.id}`)}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}
