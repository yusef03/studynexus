"use client";

import { Event } from "@/types/event";

const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

interface Props {
  events: Event[];
  onEventClick: (e: React.MouseEvent, evt: Event) => void;
  showGhosts: boolean;
}

export function MobileAgendaView({ events, onEventClick, showGhosts }: Props) {
  const eventsByDay = Array.from({ length: 7 }, () => [] as Event[]);

  events.forEach(evt => {
    if (evt.is_hidden && !showGhosts) return;
    let dayIdx = evt.day_of_week;
    if (dayIdx === null && evt.event_date) {
        const dateObj = new Date(evt.event_date);
        dayIdx = dateObj.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6;
    }
    if (dayIdx !== null && dayIdx >= 0 && dayIdx < 7) {
        eventsByDay[dayIdx].push(evt);
    }
  });

  eventsByDay.forEach(dayEvents => {
      dayEvents.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  });

  const getEventColor = (evt: Event) => {
    if (evt.event_type === "WORK") return "bg-orange-500/10 border-orange-500/30 text-orange-800 dark:text-orange-200";
    if (evt.event_type === "LIFE") return "bg-purple-500/10 border-purple-500/30 text-purple-800 dark:text-purple-200";
    if (["EXERCISE", "TUTORIAL", "PRACTICUM", "SEMINAR"].includes(evt.event_type)) return "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200";
    if (evt.event_type === "FOCUS") return "bg-amber-500/20 border-amber-500/50 text-amber-900 dark:text-amber-100 font-bold border-2 shadow-[0_0_10px_rgba(245,158,11,0.3)]";
    if (evt.event_type === "EXAM") return "bg-red-500/10 border-red-500/40 text-red-800 dark:text-red-200 font-bold border-2";
    return "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200";
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {DAYS.map((dayName, idx) => {
        const dayEvents = eventsByDay[idx];
        if (dayEvents.length === 0) return null;

        return (
          <div key={dayName} className="px-4">
            <h2 className="font-bold text-lg mb-3 sticky top-0 bg-background/95 backdrop-blur py-2 z-10 border-b">
              {dayName}
            </h2>
            <div className="space-y-3">
              {dayEvents.map(evt => (
                <div 
                  key={evt.id}
                  onClick={(e) => onEventClick(e, evt)}
                  className={`p-3 rounded-xl border shadow-sm flex flex-col gap-2 ${getEventColor(evt)} ${evt.is_hidden ? "opacity-50 border-dashed" : ""}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-sm leading-tight">
                      {evt.event_type === "FOCUS" && <span className="mr-1">🎧</span>}
                      {evt.title}
                      {evt.is_recurring === false && " (Block)"}
                    </h3>
                    <div className="text-xs font-bold bg-background/50 px-2 py-1 rounded-md whitespace-nowrap">
                      {evt.start_time?.substring(0, 5)} - {evt.end_time?.substring(0, 5)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs opacity-80 mt-1">
                    {evt.location ? (
                      <span className="flex items-center gap-1 font-medium">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {evt.location}
                      </span>
                    ) : <span></span>}
                    {evt.lecturer && <span>👨‍🏫 {evt.lecturer.split(" ")[0]}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {events.length === 0 && (
         <div className="p-8 text-center text-muted-foreground">Keine Termine im Stundenplan.</div>
      )}
    </div>
  );
}
