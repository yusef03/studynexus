"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUserModules } from "@/hooks/queries/useUserModules";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentModuleResponse } from "@/types/study";
import { Loader2, Plus, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";

// ─── Module Card ────────────────────────────────────────────
interface CardProps {
  mod: StudentModuleResponse;
  isOverlay?: boolean;
}

const StudyPlanCard = React.memo(function StudyPlanCard({ mod, isOverlay }: CardProps) {
  const t = useTranslations("dashboard.studyPlan.board");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: mod.id,
    data: { type: "module", module: mod },
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
      className={`bg-card p-3 rounded-lg shadow-sm border relative group transition-all ${
        isOverlay ? "shadow-xl scale-[1.03] rotate-[1.5deg] border-primary/50" : ""
      } hover:border-primary/50`}
    >
      {/* Drag Handle */}
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

// ─── Semester Column ────────────────────────────────────────
interface ColumnProps {
  id: string;
  title: string;
  modules: StudentModuleResponse[];
  totalEcts: number;
}

const StudyPlanColumn = React.memo(function StudyPlanColumn({ id, title, modules, totalEcts }: ColumnProps) {
  const t = useTranslations("dashboard.studyPlan.board");

  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: "column", semester: id },
  });

  const moduleIds = modules.map(m => m.id);

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
        <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
          {modules.map(mod => (
            <StudyPlanCard key={mod.id} mod={mod} />
          ))}
        </SortableContext>
        {modules.length === 0 && (
          <div className="h-20 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground/50 text-sm">
            {t("dropHere")}
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Main Board ─────────────────────────────────────────────
export function StudyPlanBoard() {
  const t = useTranslations("dashboard.studyPlan.board");
  const { data: groupedModules, isLoading } = useUserModules();
  const queryClient = useQueryClient();
  const [extraSemesters, setExtraSemesters] = useState(0);
  const [activeModule, setActiveModule] = useState<StudentModuleResponse | null>(null);

  // Sensors: PointerSensor with 8px activation distance prevents accidental drags while scrolling
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const updateSemesterMutation = useMutation({
    mutationFn: async ({ smId, semester }: { smId: string; semester: string }) => {
      const res = await fetch(`/api/study/modules/${smId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semester }),
      });
      if (!res.ok) throw new Error("Failed to update semester");
      return res.json();
    },
    onMutate: async ({ smId, semester }) => {
      await queryClient.cancelQueries({ queryKey: ["userModules"] });
      const previous = queryClient.getQueryData(["userModules"]);

      queryClient.setQueryData(["userModules"], (old: any) => {
        if (!old) return old;
        const newGroups = JSON.parse(JSON.stringify(old));
        
        let targetModule = null;
        for (const group of newGroups) {
          const idx = group.modules.findIndex((m: any) => m.id === smId);
          if (idx !== -1) {
            targetModule = group.modules[idx];
            group.modules.splice(idx, 1);
            break;
          }
        }
        
        if (targetModule) {
          targetModule.semester = semester;
          let targetGroup = newGroups.find((g: any) => g.semester?.toString() === semester);
          if (!targetGroup) {
            targetGroup = { semester: parseInt(semester) || semester, modules: [] };
            newGroups.push(targetGroup);
          }
          targetGroup.modules.push(targetModule);
        }
        return newGroups;
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["userModules"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userModules"] });
    },
  });

  const columns = useMemo(() => {
    if (!groupedModules) return [];
    
    const sems = new Set<string>();
    // Default columns: 1–6 plus any extras the user has added
    const maxSem = 6 + extraSemesters;
    for (let i = 1; i <= maxSem; i++) {
      sems.add(i.toString());
    }
    sems.add("Ungeplant");
    
    // Also include any semesters that exist in the data (e.g. from previous sessions)
    groupedModules.forEach(g => {
      if (g.semester) {
        sems.add(g.semester.toString());
        // If data has semester 7+ but user hasn't clicked "add", still show it
      }
    });
    
    const sorted = Array.from(sems).sort((a, b) => {
      if (a === "Ungeplant") return 1;
      if (b === "Ungeplant") return -1;
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    return sorted.map(sem => {
      const group = groupedModules.find(g => g.semester?.toString() === sem);
      return {
        id: sem,
        title: sem === "Ungeplant" ? t("unplanned") : t("semester", { n: sem }),
        modules: group ? group.modules : [],
      };
    });
  }, [groupedModules, extraSemesters, t]);

  // Determine next semester number for the "add" button
  const maxExistingSem = useMemo(() => {
    let max = 6 + extraSemesters;
    if (groupedModules) {
      groupedModules.forEach(g => {
        const n = Number(g.semester);
        if (!isNaN(n) && n > max) max = n;
      });
    }
    return max;
  }, [groupedModules, extraSemesters]);

  // ─── DnD Handlers ───
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const mod = event.active.data.current?.module as StudentModuleResponse | undefined;
    if (mod) setActiveModule(mod);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // We handle column changes on drag end, so no optimistic column change here
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveModule(null);
    const { active, over } = event;
    if (!over) return;

    const moduleId = active.id as string;
    const overId = over.id as string;

    // Determine target semester
    let targetSemester: string;
    if (over.data.current?.type === "column") {
      targetSemester = overId;
    } else {
      // Dropped over another module – find which column it belongs to
      const col = columns.find(c => c.modules.some(m => m.id === overId));
      if (!col) return;
      targetSemester = col.id;
    }

    // Check if already in target semester
    const currentCol = columns.find(c => c.modules.some(m => m.id === moduleId));
    if (currentCol?.id === targetSemester) return;

    updateSemesterMutation.mutate({ smId: moduleId, semester: targetSemester });
  }, [columns, updateSemesterMutation]);

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  return (
    <div className="h-full w-full overflow-x-auto flex gap-6 p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {columns.map((col) => {
          const totalEcts = col.modules.reduce((sum, m) => sum + (m.module?.ects || m.custom_ects || 0), 0);
          return (
            <StudyPlanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              modules={col.modules}
              totalEcts={totalEcts}
            />
          );
        })}

        <DragOverlay dropAnimation={null}>
          {activeModule && (
            <StudyPlanCard mod={activeModule} isOverlay />
          )}
        </DragOverlay>
      </DndContext>

      {/* + Neues Semester Button */}
      <div className="flex-shrink-0 w-80 flex flex-col items-center justify-center">
        <button
          onClick={() => setExtraSemesters(prev => prev + 1)}
          className="w-full h-20 border-2 border-dashed border-muted-foreground/30 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">{t("addSemester")}</span>
        </button>
      </div>
    </div>
  );
}
