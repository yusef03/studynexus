"use client";

import Link from "next/link";
import { AlertTriangle, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAdminSession } from "@/hooks/useAdminSession";

interface Props {
  locale: string;
}

export function AdminSessionBanner({ locale }: Props) {
  const t = useTranslations("admin.sessionBanner");
  const { isActive, isExpiringSoon, secondsLeft } = useAdminSession();

  if (isActive && !isExpiringSoon) return null;

  const timeStr = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  if (isExpiringSoon) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1 min-w-0 truncate sm:whitespace-normal">
          {t("expiringSoon", { time: timeStr })}
        </span>
        <Link
          href={`/${locale}/admin/login`}
          className="ml-2 shrink-0 flex items-center gap-1 text-xs font-medium underline hover:no-underline"
        >
          <KeyRound className="h-3 w-3" />
          {t("extend")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-zinc-50 border-b border-zinc-200 px-4 py-2 text-sm text-zinc-600">
      <KeyRound className="h-4 w-4 shrink-0" />
      <span className="flex-1 min-w-0 truncate sm:whitespace-normal text-xs sm:text-sm">
        {t("noSession")}
      </span>
      <Link
        href={`/${locale}/admin/login`}
        className="ml-2 shrink-0 text-xs font-medium underline hover:no-underline"
      >
        {t("signIn")}
      </Link>
    </div>
  );
}
