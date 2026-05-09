"use client";

import Link from "next/link";
import { AlertTriangle, KeyRound } from "lucide-react";
import { useAdminSession } from "@/hooks/useAdminSession";

interface Props {
  locale: string;
}

export function AdminSessionBanner({ locale }: Props) {
  const { isActive, isExpiringSoon, secondsLeft } = useAdminSession();

  if (isActive && !isExpiringSoon) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, "0")}`;

  if (isExpiringSoon) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Admin-Session läuft in <span className="font-mono font-semibold">{timeStr}</span> ab.
          Destruktive Operationen werden danach blockiert.
        </span>
        <Link
          href={`/${locale}/admin/login`}
          className="ml-auto flex items-center gap-1 text-xs font-medium underline hover:no-underline"
        >
          <KeyRound className="h-3 w-3" />
          Verlängern
        </Link>
      </div>
    );
  }

  // No session at all
  return (
    <div className="flex items-center gap-2 bg-zinc-50 border-b border-zinc-200 px-4 py-2 text-sm text-zinc-600">
      <KeyRound className="h-4 w-4 shrink-0" />
      <span>Keine aktive Admin-Session — Archivieren und Löschen erfordert Re-Authentifizierung.</span>
      <Link
        href={`/${locale}/admin/login`}
        className="ml-auto text-xs font-medium underline hover:no-underline"
      >
        Jetzt anmelden
      </Link>
    </div>
  );
}
