"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ModuleResponse, ModulesBySemester, UserProgramResponse } from "@/types/study";
import { useAddModule } from "@/hooks/queries/useAddModule";

const BIN_209_SUGGESTIONS = [
  { key: "bin20901", isBwl: false },
  { key: "bin20902", isBwl: false },
  { key: "bin20903", isBwl: false },
  { key: "bin20904", isBwl: false },
  { key: "bin20905", isBwl: true },
  { key: "bin20906", isBwl: true },
  { key: "bin20907", isBwl: true },
] as const;

interface Props {
  alreadyAddedModuleIds: Set<string>;
  wahlpflichtCount?: number;
  /** null = non-BIN or loading; true = Sem 1+2 complete; false = prerequisites not met */
  wpPrerequisitesMet?: boolean | null;
  onClose: () => void;
}

const selectClass = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
  "text-sm ring-offset-background",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export function AddModuleModal({ alreadyAddedModuleIds, wahlpflichtCount = 0, wpPrerequisitesMet = null, onClose }: Props) {
  const t = useTranslations("dashboard.addModule");

  const [mode, setMode] = useState<"wahlpflicht" | "custom">("wahlpflicht");
  const [catalog, setCatalog] = useState<ModuleResponse[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [customName, setCustomName] = useState("");
  const [customEcts, setCustomEcts] = useState("2");
  const [customIsGraded, setCustomIsGraded] = useState(true);
  const [selectedSuggestionKey, setSelectedSuggestionKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const addModule = useAddModule();

  const handleSuggestionChange = (key: string) => {
    setSelectedSuggestionKey(key);
    if (!key) return;
    const label = t(`ergaenzendSuggestions.${key}` as Parameters<typeof t>[0]);
    setCustomName(label);
    setCustomEcts("2");
  };

  const selectedSuggestion = BIN_209_SUGGESTIONS.find((s) => s.key === selectedSuggestionKey) ?? null;

  useEffect(() => {
    fetch("/api/study/program")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<UserProgramResponse>;
      })
      .then((prog) =>
        fetch(`/api/exam-regulations/${prog.exam_regulation_id}/modules`)
      )
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<ModulesBySemester[]>;
      })
      .then((groups) => {
        const allModules = groups.flatMap((g) => g.modules);
        const available = allModules.filter(
          (m) => m.modul_typ === "WAHLPFLICHT" && !alreadyAddedModuleIds.has(m.id)
        );
        setCatalog(available);
      })
      .catch(() => setLoadError(t("loadError")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    setSaveError(null);

    const body =
      mode === "wahlpflicht"
        ? { module_id: selectedModuleId }
        : { custom_name: customName.trim(), custom_ects: parseInt(customEcts, 10), custom_ist_benotet: customIsGraded };

    addModule.mutate(body, {
      onSuccess: () => onClose(),
      onError: (err) => setSaveError(err.message || t("saveError")),
    });
  };

  const wahlpflichtFull = wahlpflichtCount >= 2;
  const wpLocked = wpPrerequisitesMet === false;

  const canSave =
    mode === "wahlpflicht"
      ? !!selectedModuleId && !wahlpflichtFull && !wpLocked
      : customName.trim().length > 0 &&
        customEcts.trim().length > 0 &&
        Number.isInteger(Number(customEcts)) &&
        Number(customEcts) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-50 w-full max-w-md mx-4 rounded-lg border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">{t("title")}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("wahlpflicht")}
              className={cn(
                "rounded-md border px-3 py-2 text-sm text-left transition-colors",
                mode === "wahlpflicht"
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-input text-muted-foreground hover:border-foreground/40",
              )}
            >
              <div className="font-medium text-sm">{t("modeWahlpflicht")}</div>
              <div className="text-xs opacity-70 mt-0.5">{t("modeWahlpflichtDesc")}</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={cn(
                "rounded-md border px-3 py-2 text-sm text-left transition-colors",
                mode === "custom"
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-input text-muted-foreground hover:border-foreground/40",
              )}
            >
              <div className="font-medium text-sm">{t("modeCustom")}</div>
              <div className="text-xs opacity-70 mt-0.5">{t("modeCustomDesc")}</div>
            </button>
          </div>

          {/* ── WAHLPFLICHT MODE ── */}
          {mode === "wahlpflicht" && (
            <>
              {/* Explanation box */}
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 space-y-1">
                <p className="font-medium text-foreground">{t("wpExplainTitle")}</p>
                <p>{t("wpExplainBody")}</p>
              </div>

              {wpLocked && (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                  {t("wpPrerequisitesLocked")}
                </p>
              )}

              {loading && (
                <p className="text-sm text-muted-foreground">{t("loadError")}</p>
              )}
              {loadError && (
                <p className="text-sm text-destructive" role="alert">{loadError}</p>
              )}

              {!loading && !loadError && (
                <div className="space-y-1.5">
                  <Label htmlFor="add-module-select">{t("selectModuleLabel")}</Label>
                  {wahlpflichtFull ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                      {t("wahlpflichtFull")}
                    </p>
                  ) : catalog.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noModules")}</p>
                  ) : (
                    <select
                      id="add-module-select"
                      className={selectClass}
                      value={selectedModuleId}
                      onChange={(e) => setSelectedModuleId(e.target.value)}
                    >
                      <option value="">{t("selectModule")}</option>
                      {catalog.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.kuerzel ? `${m.kuerzel} – ` : ""}{m.name} ({m.ects} ECTS)
                        </option>
                      ))}
                    </select>
                  )}
                  {wahlpflichtCount > 0 && !wahlpflichtFull && (
                    <p className="text-xs text-muted-foreground">
                      {t("wpCountHint", { count: wahlpflichtCount, max: 2 })}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── CUSTOM / ERGAENZEND MODE ── */}
          {mode === "custom" && (
            <>
              {/* Explanation box */}
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 space-y-1">
                <p className="font-medium text-foreground">{t("ergaenzendExplainTitle")}</p>
                <p>{t("ergaenzendExplainBody")}</p>
              </div>

              {/* 1. Course name – primary field */}
              <div className="space-y-1.5">
                <Label htmlFor="add-custom-name">{t("customName")}</Label>
                <Input
                  id="add-custom-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t("customNamePlaceholder")}
                />
              </div>

              {/* 2. PO official name suggestion – optional, secondary */}
              <details className="group">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none list-none flex items-center gap-1">
                  <span className="group-open:hidden">▸</span>
                  <span className="group-open:hidden">▾</span>
                  {t("ergaenzendSuggestions.label")}
                </summary>
                <div className="mt-2 space-y-1.5">
                  <select
                    id="add-suggestion-select"
                    className={selectClass}
                    value={selectedSuggestionKey}
                    onChange={(e) => handleSuggestionChange(e.target.value)}
                  >
                    <option value="">{t("ergaenzendSuggestions.selectHint")}</option>
                    {BIN_209_SUGGESTIONS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {t(`ergaenzendSuggestions.${s.key}` as Parameters<typeof t>[0])}
                      </option>
                    ))}
                  </select>
                  {selectedSuggestion && !selectedSuggestion.isBwl && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                      {t("ergaenzendSuggestions.bwlHint")}
                    </p>
                  )}
                </div>
              </details>

              {/* 3. ECTS */}
              <div className="space-y-1.5">
                <Label htmlFor="add-custom-ects">{t("customEcts")}</Label>
                <Input
                  id="add-custom-ects"
                  type="number"
                  min="1"
                  max="30"
                  value={customEcts}
                  onChange={(e) => setCustomEcts(e.target.value)}
                  placeholder="2"
                />
              </div>

              {/* 4. Graded */}
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={customIsGraded}
                  onChange={(e) => setCustomIsGraded(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                {t("isGraded")}
              </label>
            </>
          )}

          {saveError && (
            <p className="text-sm text-destructive" role="alert">{saveError}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={addModule.isPending}>
            {t("close")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || addModule.isPending || loading || !!loadError}
          >
            {addModule.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
