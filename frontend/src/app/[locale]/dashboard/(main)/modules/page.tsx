import { getTranslations } from "next-intl/server";
import { ModuleList } from "@/components/study/ModuleList";

export default async function ModulesPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("nav.modules")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ModuleList />
    </div>
  );
}
