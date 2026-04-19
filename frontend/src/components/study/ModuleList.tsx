"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ModuleModal } from "@/components/study/ModuleModal";
import type { StudentModuleResponse, StudentModulesBySemester, StudiengangStatus } from "@/types/study";

const STATUS_BADGE: Record<StudiengangStatus, string> = {
  PLANNED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  REGISTERED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  PASSED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

interface Props {
  onModuleSaved?: () => void;
}

export function ModuleList({ onModuleSaved }: Props) {
  const t = useTranslations("dashboard.modules");
  const tStatus = useTranslations("dashboard.modules.status");

  const [groups, setGroups] = useState<StudentModulesBySemester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StudentModuleResponse | null>(null);

  const fetchModules = useCallback(() => {
    setLoading(true);
    fetch("/api/study/modules")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<StudentModulesBySemester[]>;
      })
      .then(setGroups)
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
    // t is stable from next-intl; excluding it avoids an infinite loop in tests
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleSave = (updated: StudentModuleResponse) => {
    setGroups((prev) =>
      prev.map((group) => ({
        ...group,
        modules: group.modules.map((m) => (m.id === updated.id ? updated : m)),
      })),
    );
    setSelected(null);
    onModuleSaved?.();
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">{t("loading")}</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">{error}</p>
    );
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("noModules")}</p>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {groups.map((group) => (
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
                      {kuerzel && (
                        <span className="text-xs text-muted-foreground">
                          {kuerzel}
                        </span>
                      )}
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

      {selected && (
        <ModuleModal
          studentModule={selected}
          open={true}
          onClose={() => setSelected(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
