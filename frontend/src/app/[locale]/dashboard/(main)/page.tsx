import { getTranslations } from "next-intl/server";
import { StatsCard } from "@/components/study/StatsCard";
import { SmartTimeline } from "@/components/dashboard/SmartTimeline";
import { DailyFocus } from "@/components/dashboard/DailyFocus";
import { ExamCountdownWidget } from "@/components/dashboard/ExamCountdownWidget";

import { cookies } from "next/headers";
import { BACKEND, bearerHeaders } from "@/lib/backend";

export default async function DashboardOverviewPage() {
  const t = await getTranslations("dashboard");
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("access_token");
  
  let firstName = "";
  if (tokenCookie) {
    try {
      const res = await fetch(`${BACKEND}/me`, {
        headers: bearerHeaders(tokenCookie.value),
        cache: "no-store"
      });
      if (res.ok) {
        const user = await res.json();
        if (user.full_name) {
          firstName = user.full_name.split(" ")[0];
        }
      }
    } catch {}
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {firstName ? t("overview.welcome", { name: firstName }) : t("overview.welcomeFallback")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("overview.subtitle")}
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
