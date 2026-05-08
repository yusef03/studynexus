"use client";

/**
 * StudyPlanBoard — personal study planning view.
 *
 * Data model:
 *   plan_semester (StudentModule) — written ONLY here. null = auto-position.
 *   semester      (StudentModule) — written ONLY by the grade-tracking flow.
 *
 * Display logic (per module):
 *   if plan_semester is set          → place in that column
 *   else if semester_empfehlung set  → place in the recommended column
 *   else                             → "Ungeplant"
 *
 * This means:
 * - PFLICHT modules auto-populate into their recommended semesters on first load.
 * - WAHLPFLICHT/ERGAENZEND modules with no recommendation land in "Ungeplant".
 * - The user can drag any module anywhere; only plan_semester is persisted.
 * - The Modules page (/modules) is completely unaffected.
 * - New modules added anywhere appear here automatically on next data sync.
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useUserModules } from "@/hooks/queries/useUserModules";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentModuleResponse } from "@/types/study";
import { Loader2, Plus, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";

// ─── Helper ──────────────────────────────────────────────────
/**
 * Determines which column a module belongs to in the StudyPlanBoard.
 * Reads plan_semester first, falls back to semester_empfehlung, then "Ungeplant".
 */
function getDisplaySemester(mod: StudentModuleResponse): string {
  if (mod.plan_semester) return mod.plan_semester;
  if (mod.module?.semester_empfehlung) return mod.module.semester_empfehlung.toString();
  return "Ungeplant";
}

// ─── LocalModule — plan_semester overlaid as `semester` for column filtering ─
// We keep a local flat list where `semester` holds the current display position.
// This avoids passing a separate field through every sub-component.
type LocalModule = StudentModuleResponse & { semester: string };

// ─── Module Card ─────────────────────────────────────────────
interface CardProps {
  mod: LocalModule;
  isOverlay?: boolean;
}

const StudyPlanCard = React.memo(function StudyPlanCard({ mod, isOverlay }: CardProps) {
  const t = useTranslations("dashboard.studyPlan.board");

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: mod.id,
    data: { type: "module", module: mod },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0 : 1, touchAction: "none" }}
      className={`bg-card p-3 rounded-lg shadow-sm border relative group transition-all ${
        isOverlay ? "shadow-xl scale-[1.03] rotate-[1.5deg] border-primary/50" : ""
      } hover:border-primary/50`}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing"
        aria-label="Drag handle"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <p className="font-medium text-sm line-clamp-2 pr-6">
        {mod.module?.name || mod.custom_name}
      </p>
      <div className="mt-2 flex justify-between items-center">
        <span className="text-[10px] uppercase text-muted-foreground font-semibold">
          {mod.module?.kuerzel || t("custom")}
        </span>
        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
          {mod.module?.ects || mod.custom_ects} ECTS
        </span>
      </div>
    </div>
  );
});

// ─── Semester Column ─────────────────────────────────────────
interface ColumnProps {
  id: string;
  title: string;
  modules: LocalModule[];
  totalEcts: number;
  isOver: boolean;
}

const StudyPlanColumn = React.memo(function StudyPlanColumn({
  id,
  title,
  modules,
  totalEcts,
  isOver,
}: ColumnProps) {
  const t = useTranslations("dashboard.studyPlan.board");

  const { setNodeRef } = useDroppable({
    id,
    data: { type: "column", semester: id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 flex flex-col bg-muted/20 rounded-xl overflow-hidden border transition-colors ${
        isOver ? "bg-primary/5 ring-2 ring-primary/30 ring-inset" : ""
      }`}
    >
      <div className="p-4 border-b bg-card flex justify-between items-center">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
          {totalEcts} ECTS
        </span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[150px]">
        {modules.map((mod) => (
          <StudyPlanCard key={mod.id} mod={mod} />
        ))}
        {modules.length === 0 && (
          <div className="h-20 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground/50 text-sm">
            {t("dropHere")}
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Main Board ──────────────────────────────────────────────
export function StudyPlanBoard() {
  const t = useTranslations("dashboard.studyPlan.board");
  const { data: groupedModules, isLoading } = useUserModules();
  const queryClient = useQueryClient();

  const [extraSemesters, setExtraSemesters] = useState(0);
  const [activeModule, setActiveModule] = useState<LocalModule | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [localModules, setLocalModules] = useState<LocalModule[]>([]);

  // Flatten server data into a local list.
  // `semester` on each LocalModule reflects the StudyPlanBoard display position
  // (plan_semester → semester_empfehlung → "Ungeplant"), NOT the grade-tracking semester.
  useEffect(() => {
    if (!groupedModules) return;
    const flat: LocalModule[] = groupedModules.flatMap((g) =>
      g.modules.map((m) => ({
        ...m,
        semester: getDisplaySemester(m),
      }))
    );
    setLocalModules(flat);
  }, [groupedModules]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Persists plan_semester to backend. Uses model_fields_set on the backend
  // so we can explicitly set plan_semester = null (reset to auto-position).
  const savePlanSemester = useMutation({
    mutationFn: async ({ smId, planSemester }: { smId: string; planSemester: string | null }) => {
      const res = await fetch(`/api/study/modules/${smId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-studynexus-client": "true",
        },
        body: JSON.stringify({ plan_semester: planSemester }),
      });
      if (!res.ok) throw new Error("Failed to save plan semester");
      return res.json();
    },
    onError: () => {
      // On failure, re-sync from server (rollback the optimistic update)
      queryClient.invalidateQueries({ queryKey: ["userModules"] });
    },
    onSettled: () => {
      // Always re-sync after mutation to get the canonical server state
      queryClient.invalidateQueries({ queryKey: ["userModules"] });
    },
  });

  // Build columns from localModules.
  // Columns 1–(6+extras) are always shown; extra semesters from data are added dynamically.
  const columns = useMemo(() => {
    const sems = new Set<string>();
    for (let i = 1; i <= 6 + extraSemesters; i++) sems.add(i.toString());
    sems.add("Ungeplant");

    // Include any semesters already present in the data (e.g. from previous sessions
    // or semesters > 6 that the user created before)
    localModules.forEach((m) => {
      if (m.semester && m.semester !== "Ungeplant") sems.add(m.semester);
    });

    return Array.from(sems)
      .sort((a, b) => {
        if (a === "Ungeplant") return 1;
        if (b === "Ungeplant") return -1;
        const na = parseInt(a, 10);
        const nb = parseInt(b, 10);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      })
      .map((sem) => ({
        id: sem,
        title: sem === "Ungeplant" ? t("unplanned") : t("semester", { n: sem }),
        modules: localModules.filter((m) => m.semester === sem),
      }));
  }, [localModules, extraSemesters, t]);

  // ─── DnD handlers ────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const mod = event.active.data.current?.module as LocalModule | undefined;
    if (mod) setActiveModule(mod);
  }, []);

  // Only update visual column highlight — NEVER setState on localModules here.
  // Changing localModules during a drag triggers @dnd-kit measureRect which
  // fires another DragOver → setState → measureRect → infinite loop.
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }
    if (over.data.current?.type === "column") {
      setOverColumnId(over.id as string);
    } else if (over.data.current?.type === "module") {
      setOverColumnId(over.data.current.module?.semester ?? null);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveModule(null);
      setOverColumnId(null);

      if (!over) return;

      const activeId = active.id as string;
      const dragged = localModules.find((m) => m.id === activeId);
      if (!dragged) return;

      // Resolve drop target column
      let targetSemester: string;
      if (over.data.current?.type === "column") {
        targetSemester = over.id as string;
      } else if (over.data.current?.type === "module") {
        targetSemester = over.data.current.module?.semester ?? "Ungeplant";
      } else {
        return;
      }

      if (dragged.semester === targetSemester) return;

      // Optimistic local update — safe here because drag is finished
      setLocalModules((prev) =>
        prev.map((m) => (m.id === activeId ? { ...m, semester: targetSemester } : m))
      );

      // Determine what to store as plan_semester:
      // "Ungeplant" → explicit unplan (stored as "Ungeplant" string, not null,
      //   so the auto-fallback to semester_empfehlung doesn't kick back in)
      // any number string → store it
      savePlanSemester.mutate({ smId: activeId, planSemester: targetSemester });
    },
    [localModules, savePlanSemester]
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-x-auto flex gap-6 p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {columns.map((col) => {
          const totalEcts = col.modules.reduce(
            (sum, m) => sum + (m.module?.ects || m.custom_ects || 0),
            0
          );
          return (
            <StudyPlanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              modules={col.modules}
              totalEcts={totalEcts}
              isOver={overColumnId === col.id}
            />
          );
        })}

        <DragOverlay dropAnimation={null}>
          {activeModule && <StudyPlanCard mod={activeModule} isOverlay />}
        </DragOverlay>
      </DndContext>

      <div className="flex-shrink-0 w-80 flex flex-col items-center justify-center">
        <button
          onClick={() => setExtraSemesters((prev) => prev + 1)}
          className="w-full h-20 border-2 border-dashed border-muted-foreground/30 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">{t("addSemester")}</span>
        </button>
      </div>
    </div>
  );
}
