"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, ListTodo, BookOpen, Settings, UserCircle, Map, ScrollText, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/Logo";
import { useUserProgram } from "@/hooks/queries/useUserProgram";
import { computeCurrentSemesterNumber, formatSemesterLabel } from "@/lib/semesterUtils";

export function AppSidebar({ locale, isAdmin = false }: { locale: string; isAdmin?: boolean }) {
  const t = useTranslations("dashboard.nav");
  const tDash = useTranslations("dashboard");
  const tAdmin = useTranslations("admin.nav");
  const pathname = usePathname();
  const { data: program } = useUserProgram();

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

  const semesterNum = program?.start_semester
    ? computeCurrentSemesterNumber(program.start_semester)
    : null;
  const semesterLabel = program?.start_semester
    ? formatSemesterLabel(program.start_semester, locale)
    : null;

  return (
    <aside className="w-64 border-r bg-muted/20 hidden md:flex flex-col h-screen sticky top-0">
      <div className="h-14 flex items-center px-6 border-b">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
          <Logo className="h-8 w-auto" />
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {routes.map((route) => {
          const isActive = route.exact
            ? pathname === route.href
            : pathname.startsWith(route.href);

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          );
        })}

        {/* Admin Link (only for admins) */}
        {isAdmin && (
          <Link
            href={`/${locale}/admin`}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mt-4 border-t pt-4",
              pathname.startsWith(`/${locale}/admin`)
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "text-muted-foreground hover:bg-red-500/5 hover:text-red-600 dark:hover:text-red-400"
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            {tAdmin("title")}
          </Link>
        )}
      </nav>

      {semesterNum !== null && (
        <div className="border-t px-4 py-3">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">
            {tDash("semester.current")}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm h-8 w-8">
              {semesterNum}
            </span>
            <div>
              <p className="text-sm font-medium leading-tight">{tDash("semester.label", { n: semesterNum })}</p>
              {semesterLabel && (
                <p className="text-[11px] text-muted-foreground">{tDash("semester.startedWith", { sem: semesterLabel })}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
