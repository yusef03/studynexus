"use client";

import { useTasks } from "@/hooks/queries/useTasks";
import { useUserModules } from "@/hooks/queries/useUserModules";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export function SmartTimeline() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { data: modulesBySemester, isLoading: modulesLoading } = useUserModules();

  if (tasksLoading || modulesLoading) {
    return <div className="p-6 border rounded-xl bg-card shadow-sm min-h-[300px] flex items-center justify-center text-muted-foreground animate-pulse">Lade Timeline...</div>;
  }

  // Helper to find module name
  const getModuleName = (moduleId?: string | null) => {
    if (!moduleId || !modulesBySemester) return null;
    for (const group of modulesBySemester) {
      const mod = group.modules.find(m => m.id === moduleId);
      if (mod) return mod.module?.name || mod.custom_name;
    }
    return null;
  };

  const activeTasks = tasks.filter(t => t.status !== "DONE");

  // Sorting logic
  // 1. EXAM_READY first
  // 2. Nearest deadline
  // 3. HIGH priority
  const sortedTasks = [...activeTasks].sort((a, b) => {
    // 1. Exam Ready
    if (a.status === "EXAM_READY" && b.status !== "EXAM_READY") return -1;
    if (b.status === "EXAM_READY" && a.status !== "EXAM_READY") return 1;

    // 1.5. Submissions
    if (a.is_submission && !b.is_submission) return -1;
    if (b.is_submission && !a.is_submission) return 1;

    // 2. Deadlines
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;

    // 3. Priority
    const pScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return pScore[b.priority] - pScore[a.priority];
  }).slice(0, 7); // Show max 7 items

  return (
    <div className="p-6 border rounded-xl bg-card shadow-sm min-h-[300px] flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          Smart Timeline
        </h2>
        <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md text-muted-foreground">
          {activeTasks.length} offene Tasks
        </span>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
           <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <span className="text-2xl">🌱</span>
           </div>
           <p className="text-muted-foreground">Dein Kanban Board ist leer.</p>
           <p className="text-xs text-muted-foreground mt-1">Keine anstehenden Aufgaben.</p>
        </div>
      ) : (
        <div className="relative pl-4 flex-1 overflow-y-auto pr-2 space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent">
          {sortedTasks.map((task) => {
            const isExam = task.status === "EXAM_READY";
            const modName = getModuleName(task.module_id);
            
            let dotColor = "bg-blue-500 border-blue-200";
            if (isExam) dotColor = "bg-red-500 border-red-200 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse";
            else if (task.priority === "HIGH") dotColor = "bg-orange-500 border-orange-200";
            
            let deadlineText = "";
            let deadlineUrgent = false;
            if (task.due_date) {
               const diffDays = (new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
               deadlineUrgent = diffDays <= 3;
               deadlineText = formatDistanceToNow(new Date(task.due_date), { addSuffix: true, locale: de });
            }

            return (
              <div key={task.id} className="relative flex items-start justify-between group">
                {/* Timeline Dot */}
                <div className="absolute -left-6 mt-1 flex items-center justify-center">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 ${dotColor} z-10`}></div>
                </div>

                <div className="w-full">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`font-semibold text-sm ${isExam ? 'text-red-600 dark:text-red-400' : ''}`}>
                      {task.title}
                    </h3>
                    {task.due_date && (
                      <span className={`text-[10px] whitespace-nowrap font-medium px-2 py-0.5 rounded-full ${deadlineUrgent ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-muted text-muted-foreground'}`}>
                        {deadlineText}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {isExam && (
                       <span className="text-[10px] font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                         KLAUSURVORBEREITUNG
                       </span>
                    )}
                    {task.is_submission && (
                       <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">
                         📄 ABGABE
                       </span>
                    )}
                    {task.priority === "HIGH" && !isExam && !task.is_submission && (
                       <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">
                         HOHE PRIO
                       </span>
                    )}
                    {modName && (
                      <span className="text-[10px] opacity-70 bg-muted px-1.5 py-0.5 rounded">
                        📚 {modName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
