"use client";

import { useState, useMemo } from "react";
import { useUserModules } from "@/hooks/queries/useUserModules";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentModule } from "@/types/study";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function StudyPlanBoard() {
  const t = useTranslations("dashboard.studyPlan.board");
  const { data: groupedModules, isLoading } = useUserModules();
  const queryClient = useQueryClient();
  const [draggedId, setDraggedId] = useState<string | null>(null);

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
        
        // Find the module
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
          let targetGroup = newGroups.find((g: any) => g.semester === semester);
          if (!targetGroup) {
            targetGroup = { semester, modules: [] };
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
    
    // We want to extract all unique semesters and sort them properly
    const sems = new Set<string>();
    // Default columns
    ["1", "2", "3", "4", "5", "6", "Ungeplant"].forEach(s => sems.add(s));
    
    groupedModules.forEach(g => {
      if (g.semester) sems.add(g.semester);
    });
    
    const sorted = Array.from(sems).sort((a, b) => {
      if (a === "Ungeplant") return 1;
      if (b === "Ungeplant") return -1;
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    const cols = sorted.map(sem => {
      const group = groupedModules.find(g => g.semester === sem);
      return {
        id: sem,
        title: sem === "Ungeplant" ? t("unplanned") : t("semester", { n: sem }),
        modules: group ? group.modules : []
      };
    });
    return cols;
  }, [groupedModules]);

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetSemester: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDraggedId(null);
    if (!id) return;

    // Check if it's already in this semester
    const col = columns.find(c => c.id === targetSemester);
    if (col && col.modules.find(m => m.id === id)) return;

    updateSemesterMutation.mutate({ smId: id, semester: targetSemester });
  };

  return (
    <div className="h-full w-full overflow-x-auto flex gap-6 p-6">
      {columns.map((col) => {
        const totalEcts = col.modules.reduce((sum, m) => sum + (m.module?.ects || m.custom_ects || 0), 0);

        return (
          <div 
            key={col.id} 
            className="flex-shrink-0 w-80 flex flex-col bg-muted/20 rounded-xl overflow-hidden border"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="p-4 border-b bg-card flex justify-between items-center">
              <h3 className="font-semibold">{col.title}</h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                {totalEcts} ECTS
              </span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {col.modules.map(mod => (
                <div
                  key={mod.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, mod.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className={`bg-card p-3 rounded-lg shadow-sm border cursor-move touch-none hover:border-primary/50 transition-all ${draggedId === mod.id ? "opacity-50" : ""}`}
                >
                  <p className="font-medium text-sm line-clamp-2">
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
              ))}
              {col.modules.length === 0 && (
                <div className="h-20 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground/50 text-sm">
                  {t("dropHere")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
