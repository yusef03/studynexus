"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, ListTodo, BookOpen, Menu, X, Settings, UserCircle, Map, ScrollText, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/Logo";

export function MobileNav({ locale, isAdmin = false }: { locale: string; isAdmin?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("dashboard.nav");
  const tAdmin = useTranslations("admin.nav");
  const pathname = usePathname();

  const routes = [
    { href: `/${locale}/dashboard`, exact: true, label: t("overview"), icon: LayoutDashboard },
    { href: `/${locale}/dashboard/modules`, label: t("modules"), icon: BookOpen },
    { href: `/${locale}/dashboard/kanban`, label: t("kanban"), icon: ListTodo },
    { href: `/${locale}/dashboard/schedule`, label: t("schedule"), icon: Calendar },
    { href: `/${locale}/dashboard/study-plan`, label: t("studyPlan"), icon: Map },
    { href: `/${locale}/dashboard/po-uebersicht`, label: t("poUebersicht"), icon: ScrollText },
    { href: `/${locale}/dashboard/profile`, label: t("profile"), icon: UserCircle },
    { href: `/${locale}/dashboard/settings`, label: t("settings"), icon: Settings },
  ];

  return (
    <div className="md:hidden flex items-center">
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-72 max-w-[80%] bg-background h-full shadow-2xl flex flex-col animate-in slide-in-from-left-4 duration-300">
            <div className="h-14 flex items-center justify-between px-6 border-b">
              <Link href={`/${locale}/dashboard`} className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <Logo className="h-8 w-auto" />
              </Link>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {routes.map((route) => {
                const isActive = route.exact
                  ? pathname === route.href
                  : pathname.startsWith(route.href);

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <route.icon className="h-5 w-5" />
                    {route.label}
                  </Link>
                );
              })}

              {/* Admin Link (only for admins) */}
              {isAdmin && (
                <Link
                  href={`/${locale}/admin`}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors mt-4 border-t pt-4",
                    pathname.startsWith(`/${locale}/admin`)
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "text-muted-foreground hover:bg-red-500/5 hover:text-red-600 dark:hover:text-red-400"
                  )}
                >
                  <ShieldCheck className="h-5 w-5" />
                  {tAdmin("title")}
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
