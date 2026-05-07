"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useTasks } from "@/hooks/queries/useTasks";
import { Task, TaskStatus, TaskUpdate } from "@/types/task";
import { TaskModal } from "./TaskModal";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useUserModules } from "@/hooks/queries/useUserModules";
import { useTranslations } from "next-intl";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "EXAM_READY", "DONE"];

export function KanbanBoard() {
  const t = useTranslations("dashboard.kanban.board");
  const { tasks, isLoading, isError, updateTask, createTask, deleteTask } = useTasks();
  const { data: modulesBySemester } = useUserModules();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSavingModal, setIsSavingModal] = useState(false);

  // Flatten modules to look up names
  const allModules = modulesBySemester
    ? modulesBySemester.flatMap((group) => group.modules)
    : [];

  // Sensors: PointerSensor with 8px activation distance prevents accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const getTasksByStatus = useCallback(
    (status: TaskStatus) =>
      localTasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.position - b.position),
    [localTasks]
  );

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  if (!isMounted) return null;
  if (isLoading) return <div className="text-muted-foreground p-8">{t("loading")}</div>;
  if (isError) return <div className="text-red-500 p-8">{t("error")}</div>;

  // --- DnD Handlers ---

  const handleDragStart = (event: DragStartEvent) => {
    const task = localTasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskItem = localTasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    // Determine the target column status
    let targetStatus: TaskStatus;

    // Check if we're over a column directly
    if (COLUMNS.includes(overId as TaskStatus)) {
      targetStatus = overId as TaskStatus;
    } else {
      // We're over another task – find its status
      const overTask = localTasks.find((t) => t.id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
    }

    // If the task is already in this column, do nothing (reordering within column handled on drop)
    if (activeTaskItem.status === targetStatus) return;

    // Move task to the new column optimistically
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, status: targetStatus } : t
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const task = localTasks.find((t) => t.id === activeId);
    if (!task) return;

    // Find the original task from server data to check if status changed
    const originalTask = tasks.find((t) => t.id === activeId);
    if (!originalTask) return;

    if (task.status !== originalTask.status) {
      // Status changed → persist to backend
      updateTask({
        id: activeId,
        payload: { status: task.status },
      });
    }
  };

  // --- Modal Handlers ---

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
          module_id: payload.module_id,
        },
        {
          onSuccess: () => {
            setIsSavingModal(false);
            setSelectedTask(null);
          },
          onError: () => setIsSavingModal(false),
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
          onError: () => setIsSavingModal(false),
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
      onError: () => setIsSavingModal(false),
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={handleCreateNewTaskClick}
          className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2 shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t("newTask")}
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full overflow-x-auto pb-4">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              id={status}
              tasks={getTasksByStatus(status)}
              allModules={allModules}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <KanbanCard
              task={activeTask}
              moduleName={
                activeTask.module_id
                  ? allModules.find((m) => m.id === activeTask.module_id)?.module?.name ||
                    allModules.find((m) => m.id === activeTask.module_id)?.custom_name ||
                    null
                  : null
              }
              onClick={() => {}}
              isOverlay
            />
          )}
        </DragOverlay>
      </DndContext>

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
