import { getTranslations } from "next-intl/server";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export default async function KanbanPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="p-6 lg:p-10 h-full flex flex-col">
      <div className="mb-8 flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">{t("kanban.title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("kanban.description")}
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  );
}
