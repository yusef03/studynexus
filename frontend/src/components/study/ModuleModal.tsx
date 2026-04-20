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

export function ModuleModal({ studentModule: sm, open, onClose, onSave }: Props) {
  const t = useTranslations("dashboard.modal");
  const tStatus = useTranslations("dashboard.modules.status");

  const [status, setStatus] = useState<StudiengangStatus>(sm.status);
  const [note, setNote] = useState<string>(sm.note !== null ? sm.note.toFixed(1) : "");
  const [semester, setSemester] = useState<string>(sm.semester ?? "");
  const [error, setError] = useState<string | null>(null);
  
  const updateModule = useUpdateModule();

  const isBenotet = sm.module?.ist_benotet ?? false;
  const displayName = sm.module?.name ?? sm.custom_name ?? "";

  if (!open) return null;

  const handleSave = () => {
    setError(null);

    const payload: { status: StudiengangStatus; semester?: string; note?: number } = { status };
    if (semester.trim()) payload.semester = semester.trim();
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
          {/* Module name */}
          <p className="text-sm font-medium">{displayName}</p>

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

          {/* Semester */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-semester">{t("semester")}</Label>
            <Input
              id="modal-semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="WS2024/25"
            />
          </div>

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
