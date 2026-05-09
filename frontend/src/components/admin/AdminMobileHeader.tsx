"use client";

import { useState, useEffect } from "react";
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
  Menu,
  ScrollText,
  Server,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAdminSession } from "@/hooks/useAdminSession";

interface Props {
  locale: string;
  adminName?: string;
}

export function AdminMobileHeader({ locale, adminName }: Props) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const { isActive, isExpiringSoon, secondsLeft } = useAdminSession();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const base = `/${locale}/admin`;

  const navItems = [
    { href: base, label: t("nav.dashboard"), icon: BarChart3, exact: true },
    { href: `${base}/users`, label: t("nav.users"), icon: Users },
    { href: `${base}/universities`, label: t("nav.universities"), icon: Building2 },
    { href: `${base}/programs`, label: t("nav.programs"), icon: GraduationCap },
    { href: `${base}/modules`, label: t("nav.modules"), icon: BookOpen },
    { href: `${base}/prerequisites`, label: t("nav.prerequisites"), icon: Link2 },
    { href: `${base}/import`, label: t("nav.bulkImport"), icon: FileUp },
    { href: `${base}/audit-log`, label: t("nav.auditLog"), icon: ClipboardList },
    { href: `${base}/system`, label: t("nav.system"), icon: Server },
  ];

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  return (
    <>
      {/* Top bar */}
      <div className="md:hidden h-12 flex items-center justify-between px-4 border-b bg-zinc-950 text-zinc-100 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-400 shrink-0" />
          <span className="text-xs font-bold tracking-widest text-red-400">{t("sidebar.brand")}</span>
          <span className="text-xs text-zinc-500">{t("sidebar.appName")}</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label={t("sidebar.openMenu")}
          className="p-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 text-zinc-100 flex flex-col md:hidden",
          "transform transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-400 shrink-0" />
            <span className="font-bold text-sm tracking-wide">{t("sidebar.brand")}</span>
            <span className="text-zinc-500 text-sm font-light">{t("sidebar.appName")}</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label={t("sidebar.closeMenu")}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
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

        {/* Footer: session + identity */}
        <div className="border-t border-zinc-800 p-3 space-y-2 shrink-0">
          {isActive ? (
            <div
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-xs",
                isExpiringSoon ? "bg-amber-900/40 text-amber-300" : "bg-zinc-800 text-zinc-400"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isExpiringSoon ? "bg-amber-400" : "bg-green-400")} />
              <span className="flex-1">{isExpiringSoon ? t("sidebar.sessionExpiring") : t("sidebar.sessionActive")}</span>
              <span className="font-mono tabular-nums">{formatTime(secondsLeft)}</span>
            </div>
          ) : (
            <Link
              href={`${base}/login`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0" />
              {t("sidebar.noSession")}
            </Link>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md">
            <ScrollText className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
            <span className="text-xs text-zinc-500 flex-1 truncate">{adminName ?? "Admin"}</span>
            <Link
              href={`/${locale}/dashboard`}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
              title={t("nav.backToDashboard")}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
