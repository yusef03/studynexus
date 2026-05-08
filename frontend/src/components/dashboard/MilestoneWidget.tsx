"use client";

import { useUserStats } from "@/hooks/queries/useUserStats";
import { useTranslations } from "next-intl";
import { GraduationCap, Lock, Unlock, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// BIN PO §6: Bachelorarbeit requires Vorprüfung + min. 134 ECTS.
// This threshold is BIN-specific; Sprint 7 will make it program-configurable.
const BA_ECTS_THRESHOLD = 134;

export function MilestoneWidget() {
  const t = useTranslations("dashboard.milestone");
  const { data: stats, isLoading } = useUserStats();

  // Don't render at all if milestone data is not applicable (no BIN program)
  if (isLoading || !stats || stats.vorpruefung_bestanden === null) return null;

  const semesterRows = [
    { label: t("sem4"), zugaenglich: stats.sem4_zugaenglich },
    { label: t("sem5"), zugaenglich: stats.sem5_zugaenglich },
    { label: t("sem6"), zugaenglich: stats.sem6_zugaenglich },
  ];

  const ectsForBa = stats.ects_fuer_ba ?? 0;
  const baPct = Math.min(100, Math.round((ectsForBa / BA_ECTS_THRESHOLD) * 100));

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-base leading-tight">{t("title")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Vorprüfung row */}
        <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/40">
          <div className="flex items-center gap-2">
            {stats.vorpruefung_bestanden ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm font-medium">{t("vorpruefung")}</span>
          </div>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              stats.vorpruefung_bestanden
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-muted text-muted-foreground",
            )}
          >
            {stats.vorpruefung_bestanden ? t("passed") : t("open")}
          </span>
        </div>

        {/* Semester unlock rows */}
        {semesterRows.map(({ label, zugaenglich }) => (
          <div
            key={label}
            className="flex items-center justify-between py-1.5 px-3 rounded-lg"
          >
            <div className="flex items-center gap-2">
              {zugaenglich ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                zugaenglich ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
              )}
            >
              {zugaenglich ? t("unlocked") : t("locked")}
            </span>
          </div>
        ))}

        {/* BA ECTS progress */}
        <div className="pt-3 mt-1 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t("ba")}</span>
            <span className="text-xs text-muted-foreground">
              {t("baEcts", { current: ectsForBa, required: BA_ECTS_THRESHOLD })}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                stats.ba_zulassung_eligible ? "bg-emerald-500" : "bg-primary",
              )}
              style={{ width: `${baPct}%` }}
            />
          </div>
          <p className="text-[11px] mt-1.5 font-medium">
            {stats.ba_zulassung_eligible ? (
              <span className="text-emerald-600 dark:text-emerald-400">{t("baEligible")}</span>
            ) : (
              <span className="text-muted-foreground">
                {t("baLocked", { required: BA_ECTS_THRESHOLD })}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
