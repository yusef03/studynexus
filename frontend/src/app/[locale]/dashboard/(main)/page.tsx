import { getTranslations } from "next-intl/server";
import { StatsCard } from "@/components/study/StatsCard";
import { SmartTimeline } from "@/components/dashboard/SmartTimeline";
import { DailyFocus } from "@/components/dashboard/DailyFocus";
import { ExamCountdownWidget } from "@/components/dashboard/ExamCountdownWidget";

export default async function DashboardOverviewPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("nav.overview")}</h1>
        <p className="mt-2 text-muted-foreground">
          Willkommen im Mission Hub. Hier ist dein Radar für die kommenden Tage.
        </p>
      </div>

      <StatsCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SmartTimeline />
        </div>
        <div className="space-y-6">
          <ExamCountdownWidget />
          <DailyFocus />
        </div>
      </div>
    </div>
  );
}
