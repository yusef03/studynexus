import { BarChart3, BookOpen, Building2, Users } from "lucide-react";

interface Props {
  params: { locale: string };
}

export default function AdminDashboardPage({ params: { locale } }: Props) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Verwaltungsoberfläche für StudyNexus — Phase 6 bringt KPI-Charts und Statistiken.
        </p>
      </div>

      {/* Quick-nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Nutzer", icon: Users, href: `/${locale}/admin/users`, desc: "Accounts verwalten" },
          { label: "Hochschulen & POs", icon: Building2, href: `/${locale}/admin/universities`, desc: "Struktur verwalten" },
          { label: "Module", icon: BookOpen, href: `/${locale}/admin/modules`, desc: "Katalog bearbeiten" },
          { label: "Analytics", icon: BarChart3, href: `/${locale}/admin/system`, desc: "System & Status" },
        ].map(({ label, icon: Icon, href, desc }) => (
          <a
            key={href}
            href={href}
            className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </a>
        ))}
      </div>

      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
        KPI-Dashboard mit Charts und Statistiken kommt in Phase 6.
      </div>
    </div>
  );
}
