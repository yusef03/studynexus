"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  FileUp,
  GraduationCap,
  Link2,
  LogOut,
  ScrollText,
  Server,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminSession } from "@/hooks/useAdminSession";

interface Props {
  locale: string;
  adminName?: string;
}

export function AdminSidebar({ locale, adminName }: Props) {
  const pathname = usePathname();
  const { isActive, isExpiringSoon, secondsLeft, clearSession } = useAdminSession();

  const base = `/${locale}/admin`;

  const navItems = [
    { href: base, label: "Dashboard", icon: BarChart3, exact: true },
    { href: `${base}/users`, label: "Nutzer", icon: Users },
    { href: `${base}/universities`, label: "Hochschulen", icon: Building2 },
    { href: `${base}/programs`, label: "Studiengänge", icon: GraduationCap },
    { href: `${base}/modules`, label: "Module", icon: BookOpen },
    { href: `${base}/prerequisites`, label: "Voraussetzungen", icon: Link2 },
    { href: `${base}/import`, label: "Bulk-Import", icon: FileUp },
    { href: `${base}/audit-log`, label: "Audit-Log", icon: ClipboardList },
    { href: `${base}/system`, label: "System", icon: Server },
  ];

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <aside className="w-60 border-r bg-zinc-950 hidden md:flex flex-col h-screen sticky top-0 text-zinc-100">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2 px-5 border-b border-zinc-800">
        <Shield className="h-5 w-5 text-red-400 shrink-0" />
        <span className="font-bold text-sm tracking-wide">ADMIN</span>
        <span className="text-zinc-500 text-sm font-light">StudyNexus</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Admin Session Status */}
      <div className="border-t border-zinc-800 p-3 space-y-2">
        {isActive ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-xs",
              isExpiringSoon
                ? "bg-amber-900/40 text-amber-300"
                : "bg-zinc-800 text-zinc-400"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                isExpiringSoon ? "bg-amber-400" : "bg-green-400"
              )}
            />
            <span className="flex-1">
              {isExpiringSoon ? "Session läuft ab" : "Session aktiv"}
            </span>
            <span className="font-mono tabular-nums">{formatTime(secondsLeft)}</span>
          </div>
        ) : (
          <Link
            href={`${base}/login`}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0" />
            Keine Admin-Session
          </Link>
        )}

        {/* Admin identity + logout */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md">
          <ScrollText className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
          <span className="text-xs text-zinc-500 flex-1 truncate">
            {adminName ?? "Admin"}
          </span>
          <Link
            href={`/${locale}/dashboard`}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Zum Dashboard"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
