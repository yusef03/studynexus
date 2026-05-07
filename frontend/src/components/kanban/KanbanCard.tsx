"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/task";
import { useTranslations, useLocale } from "next-intl";

interface Props {
  task: Task;
  moduleName?: string | null;
  onClick: () => void;
  isOverlay?: boolean;
}

export const KanbanCard = React.memo(function KanbanCard({ task, moduleName, onClick, isOverlay }: Props) {
  const locale = useLocale();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card p-4 rounded-lg shadow-sm border transition-shadow relative group ${
        isOverlay ? "shadow-xl scale-[1.03] rotate-[1.5deg] border-primary/50" : ""
      } ${task.status === "EXAM_READY" ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : ""}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing"
        aria-label="Drag handle"
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="4" cy="3" r="1.5" />
          <circle cx="12" cy="3" r="1.5" />
          <circle cx="4" cy="8" r="1.5" />
          <circle cx="12" cy="8" r="1.5" />
          <circle cx="4" cy="13" r="1.5" />
          <circle cx="12" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Clickable card body */}
      <div onClick={onClick} className="cursor-pointer">
        <h4 className="font-medium text-sm mb-2 pr-7">
          {task.is_submission && <span className="mr-1" title="Submission">📄</span>}
          {task.title}
        </h4>

        {moduleName && (
          <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            {moduleName}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {task.priority && (
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
              task.priority === "HIGH" ? "bg-red-500/10 text-red-600" :
              task.priority === "MEDIUM" ? "bg-yellow-500/10 text-yellow-600" :
              "bg-blue-500/10 text-blue-600"
            }`}>
              {task.priority}
            </span>
          )}

          {task.due_date && (
            <span className="text-[10px] flex items-center gap-1 text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {new Date(task.due_date).toLocaleDateString(locale === "en" ? "en-US" : "de-DE", { day: "2-digit", month: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
