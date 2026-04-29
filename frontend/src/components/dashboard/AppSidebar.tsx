"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, ListTodo, BookOpen, Menu, Settings, UserCircle, Map } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/Logo";

export function AppSidebar({ locale }: { locale: string }) {
  const t = useTranslations("dashboard.nav");
  const pathname = usePathname();

  const routes = [
    { href: `/${locale}/dashboard`, exact: true, label: t("overview"), icon: LayoutDashboard },
    { href: `/${locale}/dashboard/modules`, label: t("modules"), icon: BookOpen },
    { href: `/${locale}/dashboard/kanban`, label: t("kanban"), icon: ListTodo },
    { href: `/${locale}/dashboard/schedule`, label: t("schedule"), icon: Calendar },
    { href: `/${locale}/dashboard/study-plan`, label: t("studyPlan"), icon: Map },
    { href: `/${locale}/dashboard/profile`, label: t("profile"), icon: UserCircle },
    { href: `/${locale}/dashboard/settings`, label: t("settings"), icon: Settings },
  ];

  return (
    <aside className="w-64 border-r bg-muted/20 hidden md:flex flex-col h-screen sticky top-0">
      <div className="h-14 flex items-center px-6 border-b">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
          <Logo className="h-8 w-auto" />
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {routes.map((route) => {
          // If exact match is required (like /dashboard root), check exact, else check startsWith
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
      </nav>
      {/* Footer area inside sidebar (e.g. user settings or current semester) */}
    </aside>
  );
}
