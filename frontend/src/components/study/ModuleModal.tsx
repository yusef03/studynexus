"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { StudentModuleResponse, StudiengangStatus } from "@/types/study";
import { useUpdateModule } from "@/hooks/queries/useUpdateModule";

const STATUS_OPTIONS: StudiengangStatus[] = [
  "PLANNED",
  "REGISTERED",
  "PASSED",
  "FAILED",
];

interface Props {
  studentModule: StudentModuleResponse;
  open: boolean;
  onClose: () => void;
  onSave: (updated: StudentModuleResponse) => void;
}

const PRUEFUNGSART_COLOR: Record<string, string> = {
  PX: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  EA: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  R: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "BAA+Ko": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

export function ModuleModal({ studentModule: sm, open, onClose, onSave }: Props) {
  const t = useTranslations("dashboard.modal");
  const tStatus = useTranslations("dashboard.modules.status");
  const tPa = useTranslations("dashboard.modules.pruefungsart");

  const [status, setStatus] = useState<StudiengangStatus>(sm.status);
  const [note, setNote] = useState<string>(sm.note !== null ? sm.note.toFixed(1) : "");
  const [error, setError] = useState<string | null>(null);
  
  const updateModule = useUpdateModule();

  const isBenotet = sm.module !== null
    ? sm.module.ist_benotet
    : (sm.custom_ist_benotet ?? true);
  const displayName = sm.module?.name ?? sm.custom_name ?? "";

  if (!open) return null;

  const handleSave = () => {
    setError(null);

    const payload: { status: StudiengangStatus; note?: number } = { status };
    if (isBenotet && note.trim()) {
      const parsed = parseFloat(note);
      if (!isNaN(parsed)) payload.note = parsed;
    }

    updateModule.mutate(
      { id: sm.id, ...payload },
      {
        onSuccess: (updated) => onSave(updated),
        onError: (err) => setError(err.message || t("saveError")),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
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
          {/* Module name + metadata */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{displayName}</p>
            {sm.module && (sm.module.pruefungsart || sm.module.sws) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {sm.module.pruefungsart && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      PRUEFUNGSART_COLOR[sm.module.pruefungsart] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {tPa(sm.module.pruefungsart as "PX" | "EA" | "R" | "BAA+Ko")}
                  </span>
                )}
                {sm.module.sws && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                    {tPa("sws", { n: sm.module.sws })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-status">{t("status")}</Label>
            <select
              id="modal-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StudiengangStatus)}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
                "text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {tStatus(s)}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          {isBenotet ? (
            <div className="space-y-1.5">
              <Label htmlFor="modal-note">{t("note")}</Label>
              <Input
                id="modal-note"
                type="number"
                min="1.0"
                max="5.0"
                step="0.1"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="z. B. 2.3"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noteUngraded")}</p>
          )}



          {/* Error */}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={updateModule.isPending}>
            {t("close")}
          </Button>
          <Button onClick={handleSave} disabled={updateModule.isPending}>
            {updateModule.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
