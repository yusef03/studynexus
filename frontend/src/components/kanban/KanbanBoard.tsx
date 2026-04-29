"use client";

import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/queries/useTasks";
import { Task, TaskStatus, TaskUpdate } from "@/types/task";
import { TaskModal } from "./TaskModal";
import { useUserModules } from "@/hooks/queries/useUserModules";
import { polyfill } from "mobile-drag-drop";
import "mobile-drag-drop/default.css";
import { useTranslations, useLocale } from "next-intl";

// Polyfill for mobile drag and drop
if (typeof window !== "undefined") {
  polyfill({
    dragImageCenterOnTouch: true,
  });
  window.addEventListener("touchmove", () => {}, { passive: false });
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "EXAM_READY", title: "Exam Ready" },
  { id: "DONE", title: "Done" }
];

export function KanbanBoard() {
  const t = useTranslations("dashboard.kanban.board");
  const locale = useLocale();
  const { tasks, isLoading, isError, updateTask, createTask, deleteTask } = useTasks();
  const { data: modulesBySemester } = useUserModules();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSavingModal, setIsSavingModal] = useState(false);

  // Flatten modules to look up names
  const allModules = modulesBySemester 
    ? modulesBySemester.flatMap(group => group.modules)
    : [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  if (!isMounted) return null;
  if (isLoading) return <div className="text-muted-foreground p-8">{t("loading")}</div>;
  if (isError) return <div className="text-red-500 p-8">{t("error")}</div>;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, statusColumn: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDraggedId(null);
    if (!id) return;

    const draggedTask = localTasks.find(t => t.id === id);
    if (!draggedTask || draggedTask.status === statusColumn) return;

    // Optimistically update status
    const newTasks = localTasks.map(t => {
      if (t.id === id) {
        return { ...t, status: statusColumn };
      }
      return t;
    });

    setLocalTasks(newTasks);
    
    updateTask({
      id: id,
      payload: { status: statusColumn }
    });
  };

  const handleCreateNewTaskClick = () => {
    setSelectedTask({
      id: "",
      title: "",
      description: null,
      status: "TODO",
      priority: "MEDIUM",
      position: 0,
      due_date: null,
      module_id: null,
      is_submission: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "",
    });
  };

  const handleModalSave = (id: string, payload: TaskUpdate) => {
    setIsSavingModal(true);
    if (!id) {
      createTask(
        { 
          title: payload.title as string, 
          description: payload.description, 
          status: payload.status || "TODO", 
          priority: payload.priority, 
          due_date: payload.due_date, 
          module_id: payload.module_id 
        },
        { 
          onSuccess: () => {
            setIsSavingModal(false);
            setSelectedTask(null);
          },
          onError: () => setIsSavingModal(false)
        }
      );
    } else {
      updateTask(
        { id, payload },
        { 
          onSuccess: () => {
            setIsSavingModal(false);
            setSelectedTask(null);
          },
          onError: () => setIsSavingModal(false)
        }
      );
    }
  };

  const handleModalDelete = (id: string) => {
    setIsSavingModal(true);
    deleteTask(id, {
      onSuccess: () => {
        setIsSavingModal(false);
        setSelectedTask(null);
      },
      onError: () => setIsSavingModal(false)
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center">
        <button 
          onClick={handleCreateNewTaskClick}
          className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2 shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          {t("newTask")}
        </button>
      </div>

      <div className="flex gap-6 h-full overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = localTasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => a.position - b.position);

          return (
            <div 
              key={col.id} 
              className="w-80 flex-shrink-0 flex flex-col bg-muted/30 rounded-xl"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="p-4 flex items-center justify-between border-b border-border/50">
                <h3 className="font-semibold">{t(`columns.${col.id.toLowerCase()}`)}</h3>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  {colTasks.length}
                </span>
              </div>
              
              <div className="flex-1 p-4 flex flex-col gap-3 min-h-[150px] transition-colors">
                {colTasks.map((task) => {
                  const linkedMod = task.module_id ? allModules.find(m => m.id === task.module_id) : null;
                  
                  return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => setSelectedTask(task)}
                    className={`bg-card p-4 rounded-lg shadow-sm border transition-all cursor-pointer hover:border-primary/50 relative group touch-none ${
                      draggedId === task.id ? "opacity-50" : ""
                    } ${task.status === "EXAM_READY" ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : ""}`}
                  >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </div>

                    <h4 className="font-medium text-sm mb-2 pr-5">
                      {task.is_submission && <span className="mr-1" title="Submission">📄</span>}
                      {task.title}
                    </h4>
                    
                    {linkedMod && (
                      <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        {linkedMod.module?.name || linkedMod.custom_name}
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
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {new Date(task.due_date).toLocaleDateString(locale === "en" ? "en-US" : "de-DE", { day: "2-digit", month: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedTask && (
        <TaskModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
          isSaving={isSavingModal}
        />
      )}
    </div>
  );
}
