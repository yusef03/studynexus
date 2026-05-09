"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useUserStats } from "@/hooks/queries/useUserStats";
import type { UserProgramResponse, StatsResponse } from "@/types/study";
import { cn } from "@/lib/utils";
import {
  Lock, Unlock, CheckCircle2, Circle,
  BookOpen, RotateCcw, Shield, GraduationCap, AlertTriangle,
} from "lucide-react";

// ── Data tables ────────────────────────────────────────────────────────────────

const NOTE_GROUPS = [
  { meaning: "sehrGut", notes: ["1,0", "1,3"], color: "emerald" },
  { meaning: "gut", notes: ["1,7", "2,0", "2,3"], color: "green" },
  { meaning: "befriedigend", notes: ["2,7", "3,0", "3,3"], color: "yellow" },
  { meaning: "ausreichend", notes: ["3,7", "4,0"], color: "amber" },
  { meaning: "nichtAusreichend", notes: ["5,0"], color: "red" },
] as const;

type NoteColor = "emerald" | "green" | "yellow" | "amber" | "red";

const NOTE_COLOR_MAP: Record<NoteColor, string> = {
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  green:   "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  yellow:  "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
  amber:   "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  red:     "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

const PRUEFUNGSARTEN = [
  { kuerzel: "PX",     nameKey: "pxName",    modulesKey: "pxModules",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { kuerzel: "EA",     nameKey: "eaName",    modulesKey: "eaModules",    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { kuerzel: "R",      nameKey: "rName",     modulesKey: "rModules",     color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  { kuerzel: "BAA+Ko", nameKey: "baakoName", modulesKey: "baakoModules", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
] as const;

type ZulassungRow = {
  examKey: string;
  reqKey: string;
  statusField: keyof Pick<StatsResponse, "sem4_zugaenglich" | "sem5_zugaenglich" | "sem6_zugaenglich" | "ba_zulassung_eligible"> | null;
};

const ZULASSUNG_ROWS: ZulassungRow[] = [
  { examKey: "sem4",   reqKey: "sem4Req",   statusField: "sem4_zugaenglich" },
  { examKey: "sem5",   reqKey: "sem5Req",   statusField: "sem5_zugaenglich" },
  { examKey: "bin206", reqKey: "bin206Req", statusField: "sem6_zugaenglich" },
  { examKey: "sem6",   reqKey: "sem6Req",   statusField: "sem6_zugaenglich" },
  { examKey: "bin209", reqKey: "bin209Req", statusField: null },
  { examKey: "bin210", reqKey: "bin210Req", statusField: "ba_zulassung_eligible" },
];

const WIEDERHOLUNG_RULES = ["rule1", "rule2", "rule3", "rule4"] as const;
const BIN209_RULES = ["bin209Rule1", "bin209Rule2", "bin209Rule3", "bin209Rule4"] as const;
const WP_RULES = ["wpRule1", "wpRule2"] as const;
const BA_ECTS_THRESHOLD = 134;

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ icon, title, subtitle, children }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 px-6 py-4 border-b bg-muted/20">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

function StatusBadge({ met, tMet, tOpen }: { met: boolean; tMet: string; tOpen: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
        met
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-muted text-muted-foreground",
      )}
    >
      {met
        ? <CheckCircle2 className="w-3 h-3" />
        : <Circle className="w-3 h-3" />}
      {met ? tMet : tOpen}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function POUebersicht() {
  const t = useTranslations("dashboard.poUebersicht");
  const tSec = useTranslations("dashboard.poUebersicht.sections");
  const { data: stats, isLoading: statsLoading } = useUserStats();

  const { data: program, isLoading: programLoading } = useQuery<UserProgramResponse, Error>({
    queryKey: ["userProgram"],
    queryFn: async () => {
      const res = await fetch("/api/study/program");
      if (!res.ok) throw new Error("No program");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const isLoading = statsLoading || programLoading;
  const isBin = !isLoading && stats?.vorpruefung_bestanden !== null && stats?.vorpruefung_bestanden !== undefined;

  const ectsForBa = stats?.ects_fuer_ba ?? 0;
  const baPct = Math.min(100, Math.round((ectsForBa / BA_ECTS_THRESHOLD) * 100));

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          {program && (
            <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              {t("programBadge", { name: program.program.name })}
            </span>
          )}
        </div>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      )}

      {!isLoading && !isBin && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">{t("binOnly")}</p>
        </div>
      )}

      {!isLoading && isBin && stats && (
        <div className="space-y-5">

          {/* ── Section 1: Zulassungsregeln ─────────────────────────────── */}
          <SectionCard
            icon={<Lock className="w-4 h-4 text-primary" />}
            title={tSec("zulassung.title")}
            subtitle={tSec("zulassung.subtitle")}
          >
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-muted-foreground border-b">
                    <th className="pb-2 px-2">{tSec("zulassung.colExam")}</th>
                    <th className="pb-2 px-2">{tSec("zulassung.colReq")}</th>
                    <th className="pb-2 px-2 text-right">{t("liveStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {ZULASSUNG_ROWS.map((row) => {
                    const met = row.statusField === null
                      ? true
                      : !!(stats[row.statusField]);
                    return (
                      <tr key={row.examKey} className="text-sm">
                        <td className="py-2.5 px-2 font-medium">{tSec(`zulassung.${row.examKey}` as Parameters<typeof tSec>[0])}</td>
                        <td className="py-2.5 px-2 text-muted-foreground">{tSec(`zulassung.${row.reqKey}` as Parameters<typeof tSec>[0])}</td>
                        <td className="py-2.5 px-2 text-right">
                          <StatusBadge
                            met={met}
                            tMet={row.statusField === null ? t("unlocked") : t("met")}
                            tOpen={t("open")}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* ── Section 2: Notenscala ────────────────────────────────────── */}
          <SectionCard
            icon={<BookOpen className="w-4 h-4 text-primary" />}
            title={tSec("noten.title")}
            subtitle={tSec("noten.subtitle")}
          >
            <div className="space-y-3">
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-muted-foreground border-b">
                      <th className="pb-2 px-2">{tSec("noten.colNote")}</th>
                      <th className="pb-2 px-2">{tSec("noten.colMeaning")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NOTE_GROUPS.map((group) =>
                      group.notes.map((note, i) => (
                        <tr key={note} className="border-b border-border/40 last:border-0">
                          <td className="py-1.5 px-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-semibold",
                                NOTE_COLOR_MAP[group.color],
                              )}
                            >
                              {note}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-sm">
                            {i === 0
                              ? <span className="font-medium">{tSec(`noten.${group.meaning}` as Parameters<typeof tSec>[0])}</span>
                              : <span className="text-muted-foreground text-xs">↳</span>
                            }
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                {tSec("noten.bestehensgrenze")}
              </p>
            </div>
          </SectionCard>

          {/* ── Section 3: Prüfungsarten ─────────────────────────────────── */}
          <SectionCard
            icon={<Shield className="w-4 h-4 text-primary" />}
            title={tSec("pruefungsarten.title")}
            subtitle={tSec("pruefungsarten.subtitle")}
          >
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-muted-foreground border-b">
                    <th className="pb-2 px-2">{tSec("pruefungsarten.colKuerzel")}</th>
                    <th className="pb-2 px-2">{tSec("pruefungsarten.colName")}</th>
                    <th className="pb-2 px-2">{tSec("pruefungsarten.colModules")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {PRUEFUNGSARTEN.map((pa) => (
                    <tr key={pa.kuerzel}>
                      <td className="py-2.5 px-2">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", pa.color)}>
                          {pa.kuerzel}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-medium">{tSec(`pruefungsarten.${pa.nameKey}` as Parameters<typeof tSec>[0])}</td>
                      <td className="py-2.5 px-2 text-muted-foreground text-xs">{tSec(`pruefungsarten.${pa.modulesKey}` as Parameters<typeof tSec>[0])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* ── Section 4: Wiederholungsregeln ──────────────────────────── */}
          <SectionCard
            icon={<RotateCcw className="w-4 h-4 text-primary" />}
            title={tSec("wiederholung.title")}
            subtitle={tSec("wiederholung.subtitle")}
          >
            <ul className="space-y-2">
              {WIEDERHOLUNG_RULES.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  {tSec(`wiederholung.${key}` as Parameters<typeof tSec>[0])}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* ── Section 5: Sondermodule ──────────────────────────────────── */}
          <SectionCard
            icon={<Unlock className="w-4 h-4 text-primary" />}
            title={tSec("sondermodule.title")}
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">{tSec("sondermodule.bin209Title")}</p>
                <ul className="space-y-1.5">
                  {BIN209_RULES.map((key) => (
                    <li key={key} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      {tSec(`sondermodule.${key}` as Parameters<typeof tSec>[0])}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-2">{tSec("sondermodule.wpTitle")}</p>
                <ul className="space-y-1.5">
                  {WP_RULES.map((key) => (
                    <li key={key} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                      {tSec(`sondermodule.${key}` as Parameters<typeof tSec>[0])}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* ── Section 6: Bachelorarbeit ────────────────────────────────── */}
          <SectionCard
            icon={<GraduationCap className="w-4 h-4 text-primary" />}
            title={tSec("ba.title")}
            subtitle={tSec("ba.subtitle")}
          >
            <div className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  {stats.vorpruefung_bestanden
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    : <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  }
                  {tSec("ba.req1")}
                </li>
                <li className="flex items-start gap-2 text-sm">
                  {stats.ba_zulassung_eligible
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    : <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  }
                  {tSec("ba.req2")}
                </li>
              </ul>

              {/* Live ECTS bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
                  <span>{ectsForBa} / {BA_ECTS_THRESHOLD} ECTS</span>
                  <span>{baPct}%</span>
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
              </div>

              <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                {tSec("ba.meta")}
              </p>
            </div>
          </SectionCard>

        </div>
      )}
    </div>
  );
}
