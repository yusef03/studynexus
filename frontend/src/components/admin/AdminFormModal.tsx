"use client";

import { useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void;
  loading?: boolean;
  submitLabel?: string;
  /** Use "create" to show "Erstellen" as default, otherwise "Speichern" */
  submitVariant?: "save" | "create";
  children: React.ReactNode;
  /** Extra wide modal for forms with many fields */
  wide?: boolean;
}

export function AdminFormModal({
  open,
  onClose,
  title,
  onSubmit,
  loading = false,
  submitLabel,
  submitVariant = "save",
  children,
  wide = false,
}: Props) {
  const t = useTranslations("admin.formModal");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const defaultSubmitLabel = submitVariant === "create" ? t("create") : t("save");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — full-width sheet on mobile, centered modal on desktop */}
      <div
        className={cn(
          "relative z-10 w-full bg-background border-t sm:border rounded-t-xl sm:rounded-xl shadow-xl flex flex-col",
          "max-h-[90dvh] sm:max-h-[85vh]",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b shrink-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={t("cancel")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            {t("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("saving")}
              </>
            ) : (
              submitLabel ?? defaultSubmitLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
