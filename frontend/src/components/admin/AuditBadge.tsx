"use client";

import { useTranslations, useLocale } from "next-intl";
import { Clock } from "lucide-react";

interface Props {
  adminName?: string | null;
  date?: string | Date | null;
  variant?: "created" | "modified";
  className?: string;
}

export function AuditBadge({ adminName, date, variant = "modified", className }: Props) {
  const t = useTranslations("admin.auditBadge");
  const locale = useLocale();

  const formattedDate = date
    ? new Date(date).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const name = adminName ?? t("system");
  const label = variant === "created" ? t("createdBy", { name }) : t("modifiedBy", { name });

  return (
    <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className ?? ""}`}>
      <Clock className="h-3 w-3 shrink-0" />
      <span>{label}</span>
      {formattedDate && <span>{t("on", { date: formattedDate })}</span>}
    </div>
  );
}
