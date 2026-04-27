import { getTranslations } from "next-intl/server";
import { ScheduleBoard } from "@/components/schedule/ScheduleBoard";

export default async function SchedulePage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="p-6 lg:p-10 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("nav.schedule")}</h1>
        <p className="mt-2 text-muted-foreground">
          Dein interaktiver Stundenplan und Kalender.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ScheduleBoard />
      </div>
    </div>
  );
}
