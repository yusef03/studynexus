"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type AdminStatus = "active" | "inactive" | "archived" | "verified" | "unverified" | "premium";

const styles: Record<AdminStatus, string> = {
  active:     "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  inactive:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  archived:   "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  verified:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  unverified: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  premium:    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

interface Props {
  status: AdminStatus;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  const t = useTranslations("admin.status");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
        className
      )}
    >
      {t(status)}
    </span>
  );
}
