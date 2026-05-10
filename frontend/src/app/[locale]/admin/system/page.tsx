"use client";

import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  Database,
  Loader2,
  RefreshCw,
  Server,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminSystemInfo, useAdminSystemHealth } from "@/hooks/admin/useAdminSystem";
import type { AdminServiceStatus } from "@/types/admin";

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5 space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2 border-b last:border-0">
      <dt className="text-xs font-medium text-muted-foreground sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm break-all">{value ?? "—"}</dd>
    </div>
  );
}

function ServiceBadge({ service, t }: { service: AdminServiceStatus; t: ReturnType<typeof useTranslations> }) {
  if (service.status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t("statusOk")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
      <XCircle className="h-3.5 w-3.5" />
      {t("statusError")}
      {service.detail && (
        <span className="font-normal text-muted-foreground ml-1">({service.detail})</span>
      )}
    </span>
  );
}

function OverallBadge({ status, t }: { status: string; t: ReturnType<typeof useTranslations> }) {
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-semibold text-green-700 dark:text-green-300">
        <CheckCircle2 className="h-4 w-4" />
        {t("overallOk")}
      </span>
    );
  }
  if (status === "degraded") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        {t("overallDegraded")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-sm font-semibold text-red-700 dark:text-red-300">
      <XCircle className="h-4 w-4" />
      {t("overallDown")}
    </span>
  );
}

export default function AdminSystemPage() {
  const t = useTranslations("admin.system");
  const locale = useLocale();
  const qc = useQueryClient();

  const { data: info, isLoading: infoLoading } = useAdminSystemInfo();
  const { data: health, isLoading: healthLoading, dataUpdatedAt } = useAdminSystemHealth();

  function refresh() {
    qc.invalidateQueries({ queryKey: ["admin-system-info"] });
    qc.invalidateQueries({ queryKey: ["admin-system-health"] });
  }

  const lastChecked = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lastChecked && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {t("lastChecked", { time: lastChecked })}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={refresh}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {t("refresh")}
          </Button>
        </div>
      </div>

      {/* Health section */}
      <SectionCard title={t("healthSection")} icon={Activity}>
        {healthLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("loading")}</span>
          </div>
        ) : health ? (
          <>
            <div className="mb-3">
              <OverallBadge status={health.overall} t={t} />
            </div>
            <dl className="divide-y">
              <InfoRow
                label={t("dbStatus")}
                value={<ServiceBadge service={health.database} t={t} />}
              />
              <InfoRow
                label={t("redisStatus")}
                value={<ServiceBadge service={health.redis} t={t} />}
              />
            </dl>
            <p className="text-xs text-muted-foreground mt-1">
              {t("autoRefresh")}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("loadError")}</p>
        )}
      </SectionCard>

      {/* DB info section */}
      <SectionCard title={t("infoSection")} icon={Database}>
        {infoLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("loading")}</span>
          </div>
        ) : info ? (
          <dl>
            <InfoRow label={t("dbVersion")} value={<span className="font-mono text-xs">{info.db_version.split(" ").slice(0, 2).join(" ")}</span>} />
            <InfoRow label={t("dbSize")} value={`${info.db_size_mb.toFixed(1)} MB`} />
            <InfoRow label={t("totalUsers")} value={info.total_users.toLocaleString(locale)} />
            <InfoRow label={t("totalModules")} value={info.total_modules.toLocaleString(locale)} />
            <InfoRow label={t("totalAuditLogs")} value={info.total_audit_logs.toLocaleString(locale)} />
            <InfoRow
              label={t("checkedAt")}
              value={new Date(info.checked_at).toLocaleString(locale)}
            />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">{t("loadError")}</p>
        )}
      </SectionCard>

      {/* Server section */}
      <SectionCard title={t("serverSection")} icon={Server}>
        <dl>
          <InfoRow label={t("environment")} value="Docker Compose (local)" />
          <InfoRow label={t("frontendVersion")} value="Next.js 14 (App Router)" />
          <InfoRow label={t("backendVersion")} value="FastAPI + SQLAlchemy" />
          <InfoRow label={t("dbEngine")} value="PostgreSQL" />
          <InfoRow label={t("cacheEngine")} value="Redis" />
        </dl>
      </SectionCard>
    </div>
  );
}
