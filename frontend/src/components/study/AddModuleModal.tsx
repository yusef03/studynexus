"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ModuleResponse, StudentModuleResponse, UserProgramResponse } from "@/types/study";

interface Props {
  alreadyAddedModuleIds: Set<string>;
  onClose: () => void;
  onAdded: (sm: StudentModuleResponse) => void;
}

const selectClass = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
  "text-sm ring-offset-background",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export function AddModuleModal({ alreadyAddedModuleIds, onClose, onAdded }: Props) {
  const t = useTranslations("dashboard.addModule");

  const [mode, setMode] = useState<"wahlpflicht" | "custom">("wahlpflicht");
  const [catalog, setCatalog] = useState<ModuleResponse[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [customName, setCustomName] = useState("");
  const [customEcts, setCustomEcts] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
        return res.json() as Promise<ModuleResponse[]>;
      })
      .then((modules) => {
        const available = modules.filter(
          (m) => m.modul_typ === "WAHLPFLICHT" && !alreadyAddedModuleIds.has(m.id)
        );
        setCatalog(available);
      })
      .catch(() => setLoadError(t("loadError")))
      .finally(() => setLoading(false));
    // alreadyAddedModuleIds and t are stable at call time; no re-fetch needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    const body: Record<string, unknown> =
      mode === "wahlpflicht"
        ? { module_id: selectedModuleId }
        : { custom_name: customName.trim(), custom_ects: parseInt(customEcts, 10) };

    try {
      const res = await fetch("/api/study/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.detail ?? t("saveError"));
        return;
      }
      const added: StudentModuleResponse = await res.json();
      onAdded(added);
    } catch {
      setSaveError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const canSave =
    mode === "wahlpflicht"
      ? !!selectedModuleId
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
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="add-mode"
                value="wahlpflicht"
                checked={mode === "wahlpflicht"}
                onChange={() => setMode("wahlpflicht")}
              />
              {t("modeWahlpflicht")}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="add-mode"
                value="custom"
                checked={mode === "custom"}
                onChange={() => setMode("custom")}
              />
              {t("modeCustom")}
            </label>
          </div>

          {loading && (
            <p className="text-sm text-muted-foreground">{t("loadError")}</p>
          )}

          {loadError && (
            <p className="text-sm text-destructive" role="alert">{loadError}</p>
          )}

          {!loading && !loadError && mode === "wahlpflicht" && (
            <div className="space-y-1.5">
              <Label htmlFor="add-module-select">{t("modeWahlpflicht")}</Label>
              {catalog.length === 0 ? (
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
            </div>
          )}

          {!loading && !loadError && mode === "custom" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="add-custom-name">{t("customName")}</Label>
                <Input
                  id="add-custom-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="z. B. Unternehmerisches Planspiel"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-custom-ects">{t("customEcts")}</Label>
                <Input
                  id="add-custom-ects"
                  type="number"
                  min="1"
                  max="30"
                  value={customEcts}
                  onChange={(e) => setCustomEcts(e.target.value)}
                  placeholder="z. B. 2"
                />
              </div>
            </>
          )}

          {saveError && (
            <p className="text-sm text-destructive" role="alert">{saveError}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("close")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || saving || loading || !!loadError}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
