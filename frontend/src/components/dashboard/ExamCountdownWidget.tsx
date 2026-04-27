"use client";

import { useEvents } from "@/hooks/queries/useEvents";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export function ExamCountdownWidget() {
  const { events, isLoading } = useEvents();

  if (isLoading) {
    return <div className="p-6 border rounded-xl bg-card shadow-sm animate-pulse min-h-[200px] flex items-center justify-center text-muted-foreground">Lade Countdowns...</div>;
  }

  // Filter exams that are in the future
  const now = new Date();
  const exams = events.filter(e => {
    if (e.event_type !== "EXAM") return false;
    if (!e.event_date) return false;
    const examDate = new Date(e.event_date);
    if (e.start_time) {
      const [h, m] = e.start_time.split(":");
      examDate.setHours(Number(h), Number(m));
    }
    return examDate.getTime() > now.getTime();
  }).sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime());

  return (
    <div className="p-6 border rounded-xl bg-card shadow-sm min-h-[200px] flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <span className="text-red-500">⏳</span>
          Klausur-Countdowns
        </h2>
      </div>

      {exams.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
           <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <span className="text-xl">🎓</span>
           </div>
           <p className="text-muted-foreground text-sm">Keine anstehenden Klausuren!</p>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {exams.slice(0, 3).map(exam => {
            const examDate = new Date(exam.event_date!);
            const diffDays = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
            
            let colorClass = "bg-emerald-500";
            let textColor = "text-emerald-700 dark:text-emerald-400";
            let bgLight = "bg-emerald-50 dark:bg-emerald-900/20";
            let borderClass = "border-emerald-200 dark:border-emerald-800";
            
            if (diffDays <= 14) {
              colorClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse";
              textColor = "text-red-700 dark:text-red-400";
              bgLight = "bg-red-50 dark:bg-red-900/20";
              borderClass = "border-red-200 dark:border-red-800";
            } else if (diffDays <= 30) {
              colorClass = "bg-orange-500";
              textColor = "text-orange-700 dark:text-orange-400";
              bgLight = "bg-orange-50 dark:bg-orange-900/20";
              borderClass = "border-orange-200 dark:border-orange-800";
            }

            return (
              <div key={exam.id} className={`p-3 rounded-lg border ${borderClass} ${bgLight}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-semibold text-sm ${textColor}`}>{exam.title}</h3>
                  <div className="text-right">
                    <span className={`text-xl font-bold ${textColor}`}>{diffDays}</span>
                    <span className={`text-[10px] ml-1 ${textColor} opacity-80 uppercase tracking-wider`}>Tage</span>
                  </div>
                </div>
                <div className="w-full bg-background rounded-full h-1.5 mb-1 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${colorClass}`} style={{ width: `${Math.max(5, 100 - (diffDays / 60) * 100)}%` }}></div>
                </div>
                <div className="text-[10px] text-muted-foreground flex justify-between">
                  <span>{examDate.toLocaleDateString("de-DE")}</span>
                  <span>{exam.start_time?.substring(0, 5)} Uhr</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
