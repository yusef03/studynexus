"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/hooks/useAdminSession";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the typed reason when confirmed */
  onConfirm: (reason: string) => void;
  entityName: string;
  loading?: boolean;
}

export function ArchiveDialog({ open, onClose, onConfirm, entityName, loading = false }: Props) {
  const t = useTranslations("admin.archiveDialog");
  const { isActive } = useAdminSession();
  const [reason, setReason] = useState("");

  // Reset reason when dialog opens/closes
  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full sm:max-w-md bg-background border-t sm:border rounded-t-xl sm:rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-6 pt-5 pb-4">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2 shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-base font-semibold">{t("title")}</h2>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 pb-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("description", { name: entityName })}
          </p>

          {!isActive && (
            <p className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {t("noSession")}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="archive-reason">
              {t("reasonLabel")}
            </label>
            <textarea
              id="archive-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            {t("cancel")}
          </Button>
          <Button
            onClick={() => onConfirm(reason)}
            disabled={!isActive || !reason.trim() || loading}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("loading")}
              </>
            ) : (
              t("confirm")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
