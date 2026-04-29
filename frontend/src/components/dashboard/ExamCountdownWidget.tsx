"use client";

import { useEvents } from "@/hooks/queries/useEvents";
import { AlertCircle, CalendarDays, Clock } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export function ExamCountdownWidget() {
  const t = useTranslations("dashboard.widgets.examCountdown");
  const locale = useLocale();
  const { events, isLoading } = useEvents();

  if (isLoading) {
    return <div className="p-6 border rounded-xl bg-card shadow-sm animate-pulse min-h-[200px] flex items-center justify-center text-muted-foreground">{t("loading")}</div>;
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
  }).map(exam => ({
    ...exam,
    daysLeft: Math.max(0, Math.ceil((new Date(exam.event_date!).getTime() - now.getTime()) / (1000 * 3600 * 24)))
  })).sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            {t("title")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
           <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <span className="text-xl">🎓</span>
           </div>
           <p className="text-muted-foreground text-sm">{t("noExams")}</p>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {exams.slice(0, 3).map(exam => {
            const examDate = new Date(exam.event_date!);
            
            let colorClass = "bg-emerald-500";
            let textColor = "text-emerald-700 dark:text-emerald-400";
            let bgLight = "bg-emerald-50 dark:bg-emerald-900/20";
            let borderClass = "border-emerald-200 dark:border-emerald-800";
            
            if (exam.daysLeft <= 14) {
              colorClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse";
              textColor = "text-red-700 dark:text-red-400";
              bgLight = "bg-red-50 dark:bg-red-900/20";
              borderClass = "border-red-200 dark:border-red-800";
            } else if (exam.daysLeft <= 30) {
              colorClass = "bg-orange-500";
              textColor = "text-orange-700 dark:text-orange-400";
              bgLight = "bg-orange-50 dark:bg-orange-900/20";
              borderClass = "border-orange-200 dark:border-orange-800";
            }

            return (
              <div key={exam.id} className={`p-3 rounded-lg border ${borderClass} ${bgLight}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-semibold text-sm ${textColor}`}>{exam.title}</h3>
                  <div className={`flex flex-col items-center justify-center min-w-[56px] px-2 py-1 rounded-lg ${exam.daysLeft <= 7 ? 'bg-red-500/10 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                    <span className="text-xl font-bold leading-none mb-0.5">{exam.daysLeft === 0 ? "!" : exam.daysLeft}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider">{exam.daysLeft === 0 ? t("today") : t("days")}</span>
                  </div>
                </div>
                <div className="w-full bg-background rounded-full h-1.5 mb-1 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${colorClass}`} style={{ width: `${Math.max(5, 100 - (exam.daysLeft / 60) * 100)}%` }}></div>
                </div>
                <div className="text-[10px] text-muted-foreground flex justify-between">
                  <span>{examDate.toLocaleDateString(locale === "en" ? "en-US" : "de-DE")}</span>
                  <span>{exam.start_time?.substring(0, 5)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
