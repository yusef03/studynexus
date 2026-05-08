"use client";

import { useState } from "react";
import { useUserModules } from "@/hooks/queries/useUserModules";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ModuleModal } from "@/components/study/ModuleModal";
import { AddModuleModal } from "@/components/study/AddModuleModal";
import type { StudentModuleResponse, StudentModulesBySemester, StudiengangStatus } from "@/types/study";

const PRUEFUNGSART_COLOR: Record<string, string> = {
  PX: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  EA: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  R: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "BAA+Ko": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const STATUS_BADGE: Record<StudiengangStatus, string> = {
  PLANNED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  REGISTERED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  PASSED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function ModuleList() {
  const t = useTranslations("dashboard.modules");
  const tStatus = useTranslations("dashboard.modules.status");
  const tPa = useTranslations("dashboard.modules.pruefungsart");

  const { data: groups, isLoading: loading, isError } = useUserModules();
  const [selected, setSelected] = useState<StudentModuleResponse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSave = () => {
    setSelected(null);
  };

  const currentGroups = groups ?? [];
  const allModules = currentGroups.flatMap((g) => g.modules);
  const addedModuleIds = new Set(
    allModules.map((sm) => sm.module_id).filter((id): id is string => id !== null),
  );
  const wahlpflichtCount = allModules.filter(
    (sm) => sm.module?.modul_typ === "WAHLPFLICHT",
  ).length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {t("loading")}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">{t("loadError")}</p>
    );
  }

  if (currentGroups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("noModules")}</p>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {currentGroups.map((group) => (
          <section key={group.semester ?? "none"}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {group.semester !== null
                ? t("semesterN", { n: group.semester })
                : t("noSemester")}
            </h3>

            <div className="rounded-lg border divide-y">
              {group.modules.map((sm) => {
                const name =
                  sm.module?.name ?? sm.custom_name ?? t("unknown");
                const ects =
                  sm.module?.ects ?? sm.custom_ects ?? 0;
                const kuerzel = sm.module?.kuerzel ?? null;

                return (
                  <button
                    key={sm.id}
                    onClick={() => setSelected(sm)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium truncate">{name}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {kuerzel && (
                          <span className="text-xs text-muted-foreground">
                            {kuerzel}
                          </span>
                        )}
                        {sm.module?.pruefungsart && (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium leading-4",
                              PRUEFUNGSART_COLOR[sm.module.pruefungsart] ??
                                "bg-muted text-muted-foreground",
                            )}
                          >
                            {tPa(sm.module.pruefungsart as "PX" | "EA" | "R" | "BAA+Ko")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {ects} ECTS
                      </span>
                      {sm.note !== null && (
                        <span className="text-xs font-medium w-8 text-right">
                          {sm.note.toFixed(1)}
                        </span>
                      )}
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_BADGE[sm.status],
                        )}
                      >
                        {tStatus(sm.status)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="mt-2 text-sm text-primary hover:underline"
      >
        {t("addButton")}
      </button>

      {selected && (
        <ModuleModal
          studentModule={selected}
          open={true}
          onClose={() => setSelected(null)}
          onSave={handleSave}
        />
      )}

      {showAddModal && (
        <AddModuleModal
          alreadyAddedModuleIds={addedModuleIds}
          wahlpflichtCount={wahlpflichtCount}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
