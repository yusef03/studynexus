"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskStatus } from "@/types/task";
import { KanbanCard } from "./KanbanCard";
import { useTranslations } from "next-intl";

interface Props {
  id: TaskStatus;
  tasks: Task[];
  allModules: Array<{ id: string; module?: { name: string } | null; custom_name?: string | null }>;
  onTaskClick: (task: Task) => void;
}

export const KanbanColumn = React.memo(function KanbanColumn({ id, tasks, allModules, onTaskClick }: Props) {
  const t = useTranslations("dashboard.kanban.board");

  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: "column", status: id },
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`w-80 flex-shrink-0 flex flex-col bg-muted/30 rounded-xl transition-colors ${
        isOver ? "bg-primary/5 ring-2 ring-primary/30 ring-inset" : ""
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-border/50">
        <h3 className="font-semibold">{t(`columns.${id.toLowerCase()}`)}</h3>
        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3 min-h-[150px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => {
            const linkedMod = task.module_id
              ? allModules.find((m) => m.id === task.module_id)
              : null;

            return (
              <KanbanCard
                key={task.id}
                task={task}
                moduleName={linkedMod?.module?.name || linkedMod?.custom_name || null}
                onClick={() => onTaskClick(task)}
              />
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
});
