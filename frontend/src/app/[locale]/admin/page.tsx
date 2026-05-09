"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  Database,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { KPICard } from "@/components/admin/KPICard";
import { GrowthChart } from "@/components/admin/GrowthChart";
import { useAdminSession } from "@/hooks/useAdminSession";

interface AdminStats {
  total_users: number;
  active_users_30d: number;
  premium_users: number;
  total_student_modules: number;
  passed_modules_today: number;
  new_registrations_today: number;
  new_registrations_week: number;
  total_universities: number;
  total_programs: number;
  total_modules: number;
  db_size_mb: number;
}

interface DailyRegistration {
  date: string;
  count: number;
}

interface GrowthData {
  data: DailyRegistration[];
  total: number;
}

interface Props {
  params: { locale: string };
}

export default function AdminDashboardPage({ params: { locale } }: Props) {
  const t = useTranslations("admin.dashboard");
  const { token } = useAdminSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [growth, setGrowth] = useState<GrowthData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingGrowth, setLoadingGrowth] = useState(true);

  useEffect(() => {
    const headers: HeadersInit = { "x-studynexus-client": "true" };
    if (token) headers["x-admin-token"] = token;

    fetch("/api/admin/stats", { headers })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setStats(d))
      .finally(() => setLoadingStats(false));

    fetch("/api/admin/stats/growth?period=30d", { headers })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setGrowth(d))
      .finally(() => setLoadingGrowth(false));
  }, [token]);

  const chartData = growth?.data.map((d) => ({ day: d.date, count: d.count })) ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("subtitle")}</p>
      </div>

      {/* Primary KPI Cards — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          label={t("kpi.totalUsers")}
          value={stats?.total_users ?? "—"}
          icon={Users}
          sub={t("kpi.today", { count: stats?.new_registrations_today ?? 0 })}
          loading={loadingStats}
        />
        <KPICard
          label={t("kpi.activeUsers")}
          value={stats?.active_users_30d ?? "—"}
          icon={TrendingUp}
          sub={t("kpi.weekNew", { count: stats?.new_registrations_week ?? 0 })}
          loading={loadingStats}
        />
        <KPICard
          label={t("kpi.premiumUsers")}
          value={stats?.premium_users ?? "—"}
          icon={GraduationCap}
          loading={loadingStats}
        />
        <KPICard
          label={t("kpi.passedToday")}
          value={stats?.passed_modules_today ?? "—"}
          icon={CheckCircle2}
          sub={t("kpi.total", { count: stats?.total_student_modules ?? 0 })}
          loading={loadingStats}
        />
      </div>

      {/* Growth Chart */}
      <div className="rounded-lg border bg-card p-4 sm:p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">{t("growth.title")}</h2>
          <p className="text-xs text-muted-foreground">
            {growth ? t("growth.subtitleTotal", { total: growth.total }) : t("growth.subtitle")}
          </p>
        </div>
        <GrowthChart data={chartData} loading={loadingGrowth} />
      </div>

      {/* Secondary KPIs — 2 cols on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <KPICard
          label={t("kpi.universities")}
          value={stats?.total_universities ?? "—"}
          icon={Building2}
          loading={loadingStats}
        />
        <KPICard
          label={t("kpi.programs")}
          value={stats?.total_programs ?? "—"}
          icon={BookOpen}
          loading={loadingStats}
        />
        <KPICard
          label={t("kpi.catalogModules")}
          value={stats?.total_modules ?? "—"}
          icon={BarChart3}
          loading={loadingStats}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* DB Size */}
      {stats && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-md px-4 py-2">
          <Database className="h-3.5 w-3.5 shrink-0" />
          <span>{t("dbSize")} <span className="font-mono">{stats.db_size_mb.toFixed(1)} MB</span></span>
        </div>
      )}

      {/* Quick-nav */}
      <div>
        <h2 className="text-sm font-semibold mb-3">{t("management")}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { labelKey: "quickNav.usersLabel", descKey: "quickNav.usersDesc", icon: Users, href: `/${locale}/admin/users` },
            { labelKey: "quickNav.universitiesLabel", descKey: "quickNav.universitiesDesc", icon: Building2, href: `/${locale}/admin/universities` },
            { labelKey: "quickNav.modulesLabel", descKey: "quickNav.modulesDesc", icon: BookOpen, href: `/${locale}/admin/modules` },
            { labelKey: "quickNav.systemLabel", descKey: "quickNav.systemDesc", icon: BarChart3, href: `/${locale}/admin/system` },
          ].map(({ labelKey, descKey, icon: Icon, href }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:p-4 hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                <span className="font-medium text-xs sm:text-sm">{t(labelKey as Parameters<typeof t>[0])}</span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">{t(descKey as Parameters<typeof t>[0])}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
