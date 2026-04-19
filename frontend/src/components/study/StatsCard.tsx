"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { StatsResponse } from "@/types/study";

interface Props {
  refreshKey?: number;
}

export function StatsCard({ refreshKey = 0 }: Props) {
  const t = useTranslations("dashboard.stats");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/study/stats")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<StatsResponse>;
      })
      .then(setStats)
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
    // t is stable from next-intl and excluded intentionally; refreshKey is the only trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const progressWidth = `${Math.min(stats.fortschritt_prozent, 100).toFixed(1)}%`;

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {/* GPA */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{t("gpa")}</span>
          <span className="text-3xl font-bold tracking-tight">
            {stats.gpa !== null ? stats.gpa.toFixed(1).replace(".", ",") : t("noGpa")}
          </span>
        </div>

        {/* ECTS */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{t("ects")}</span>
          <span className="text-3xl font-bold tracking-tight">
            {stats.erreichte_ects}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {t("of")} {stats.gesamt_ects}
            </span>
          </span>
        </div>

        {/* Progress + counts */}
        <div className="col-span-2 flex flex-col justify-center gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-600 dark:text-green-400">
              {stats.bestandene_module} {t("passed")}
            </span>
            <span className="text-muted-foreground">
              {stats.offene_module} {t("open")}
            </span>
            <span className="text-red-600 dark:text-red-400">
              {stats.nicht_bestandene_module} {t("failed")}
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            aria-label={`${t("progress")}: ${stats.fortschritt_prozent.toFixed(1)}%`}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: progressWidth }}
              role="progressbar"
              aria-valuenow={stats.fortschritt_prozent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {t("progress")}: {stats.fortschritt_prozent.toFixed(1)} %
          </span>
        </div>
      </div>
    </div>
  );
}
