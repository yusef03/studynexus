"use client";

import { useEvents } from "@/hooks/queries/useEvents";
import { useEffect, useState } from "react";
import { Event } from "@/types/event";

function getDayOfWeek(date: Date) {
  // Convert JS Sunday=0 to Monday=0, Sunday=6
  return (date.getDay() + 6) % 7;
}

export function DailyFocus() {
  const { events, isLoading } = useEvents("WiSe2425"); // MVP hardcoded semester tag for now
  const [isTomorrow, setIsTomorrow] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentStr = `${currentH.toString().padStart(2, "0")}:${currentM.toString().padStart(2, "0")}:00`;
    
    let targetDay = getDayOfWeek(now);
    let targetDateStr = now.toISOString().split('T')[0];
    let isShowingTomorrow = false;

    // Check today's events
    const todaysEvents = events.filter(evt => {
      if (evt.is_hidden) return false;
      const isTodayDay = evt.is_recurring && evt.day_of_week === targetDay;
      const isTodayDate = !evt.is_recurring && evt.event_date === targetDateStr;
      
      if (!isTodayDay && !isTodayDate) return false;
      
      // Keep if it hasn't ended yet
      if (evt.end_time && evt.end_time < currentStr) return false;
      
      return true;
    });

    if (todaysEvents.length === 0 || currentH >= 20) {
      // Switch to tomorrow
      isShowingTomorrow = true;
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDay = getDayOfWeek(tomorrow);
      targetDateStr = tomorrow.toISOString().split('T')[0];
    }

    // Fetch Target Day events
    const activeEvents = events.filter(evt => {
      if (evt.is_hidden) return false;
      const isTargetDay = evt.is_recurring && evt.day_of_week === targetDay;
      const isTargetDate = !evt.is_recurring && evt.event_date === targetDateStr;
      return isTargetDay || isTargetDate;
    }).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

    setIsTomorrow(isShowingTomorrow);
    setFilteredEvents(activeEvents);

  }, [events]);

  if (isLoading) {
    return <div className="p-6 border rounded-xl bg-card shadow-sm min-h-[300px] flex items-center justify-center text-muted-foreground animate-pulse">Lade Radar...</div>;
  }

  return (
    <div className="p-6 border rounded-xl bg-card shadow-sm min-h-[300px] flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Daily Focus
        </h2>
        <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md text-muted-foreground">
          {isTomorrow ? "Morgen" : "Heute"}
        </span>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
           <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <span className="text-2xl">🎉</span>
           </div>
           <p className="text-muted-foreground">Keine anstehenden Termine mehr.</p>
           <p className="text-xs text-muted-foreground mt-1">Geniess die freie Zeit!</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto pr-2">
          {filteredEvents.map((evt) => {
            let colorClass = "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200 border-l-4 border-l-blue-500";
            if (evt.event_type === "WORK") colorClass = "bg-orange-500/10 border-orange-500/30 text-orange-800 dark:text-orange-200 border-l-4 border-l-orange-500";
            else if (evt.event_type === "LIFE") colorClass = "bg-purple-500/10 border-purple-500/30 text-purple-800 dark:text-purple-200 border-l-4 border-l-purple-500";
            else if (["EXERCISE", "TUTORIAL", "PRACTICUM", "SEMINAR"].includes(evt.event_type)) colorClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 border-l-4 border-l-emerald-500";
            else if (evt.event_type === "EXAM") colorClass = "bg-red-500/10 border-red-500/40 text-red-800 dark:text-red-200 font-bold border-l-4 border-l-red-500";

            return (
              <div key={evt.id} className={`p-3 rounded-lg border flex items-start gap-4 transition-all hover:shadow-sm ${colorClass}`}>
                <div className="flex flex-col text-center w-14 shrink-0">
                  <span className="text-xs font-bold">{evt.start_time?.substring(0, 5)}</span>
                  <span className="text-[10px] opacity-70">{evt.end_time?.substring(0, 5)}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{evt.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] opacity-80">
                    {evt.location && (
                      <span className="flex items-center gap-1 font-medium">
                        📍 {evt.location}
                      </span>
                    )}
                    {evt.lecturer && (
                      <span className="flex items-center gap-1">
                        👨‍🏫 {evt.lecturer}
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
