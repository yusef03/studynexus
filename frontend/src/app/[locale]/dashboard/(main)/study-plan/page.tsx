import { getTranslations } from "next-intl/server";
import { StudyPlanBoard } from "@/components/study/StudyPlanBoard";

export default async function StudyPlanPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="p-6 lg:p-10 h-[calc(100vh-3.5rem)] flex flex-col min-w-0">
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("studyPlan.title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("studyPlan.description")}
        </p>
      </div>

      <div className="flex-1 overflow-hidden min-h-0 bg-muted/10 rounded-xl border">
        <StudyPlanBoard />
      </div>
    </div>
  );
}
