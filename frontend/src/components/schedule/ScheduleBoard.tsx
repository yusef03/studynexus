"use client";

import { useState, useEffect } from "react";
import { useEvents } from "@/hooks/queries/useEvents";
import { useTasks } from "@/hooks/queries/useTasks";
import { EventUpdate } from "@/types/event";
import { EventModal } from "./EventModal";
import { MobileAgendaView } from "./MobileAgendaView";
import { Event } from "@/types/event";

const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
const START_HOUR = 8;
const END_HOUR = 20;
const TOTAL_ROWS = (END_HOUR - START_HOUR) * 4; // 48 quarters

// helper
function timeToRow(timeStr: string | null): number {
  if (!timeStr) return 1;
  const [h, m] = timeStr.split(":").map(Number);
  const minutesFromStart = (h - START_HOUR) * 60 + m;
  const row = Math.floor(minutesFromStart / 15) + 1;
  return Math.max(1, Math.min(row, TOTAL_ROWS + 1));
}

export function ScheduleBoard() {
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents();
  const { tasks } = useTasks();
  
  const [showGhosts, setShowGhosts] = useState(false);
  const [currentTimeRow, setCurrentTimeRow] = useState<number | null>(null);
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [initialDateSlot, setInitialDateSlot] = useState<{day_of_week: number, start_time: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);

  // Global Semester State (MVP hardcoded for now, would be passed from layout later)
  const [semesterTag, setSemesterTag] = useState("WiSe2425");

  // Red Line logic
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      
      if (h >= START_HOUR && h < END_HOUR) {
        const mins = (h - START_HOUR) * 60 + m;
        setCurrentTimeRow(mins / 15 + 1);
      } else {
        setCurrentTimeRow(null);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSlotClick = (dayIndex: number, rowStart: number) => {
    const totalMinutes = (rowStart - 1) * 15;
    const h = Math.floor(totalMinutes / 60) + START_HOUR;
    const m = totalMinutes % 60;
    const timeString = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    setInitialDateSlot({ day_of_week: dayIndex, start_time: timeString });
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, evt: Event) => {
    e.stopPropagation();
    setSelectedEvent(evt);
    setInitialDateSlot(null);
    setCollisionWarning(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (id: string | null, payload: EventUpdate, force: boolean) => {
    setIsSaving(true);
    setCollisionWarning(null);

    if (id) {
      updateEvent({ id, payload }, {
        onSuccess: () => { setIsModalOpen(false); setIsSaving(false); },
        onError: () => setIsSaving(false)
      });
    } else {
      createEvent({ payload: payload as any, force }, {
        onSuccess: () => { setIsModalOpen(false); setIsSaving(false); },
        onError: (err: any) => {
          setIsSaving(false);
          if (err.message === "Collision detected") {
            // we clean the detail string since we appended |COLLISION|
            const parts = err.collisionData?.split("|COLLISION|");
            setCollisionWarning(`Überschneidet sich zeitlich mit "${parts ? parts[1] : 'einem anderen Event'}".`);
          }
        }
      });
    }
  };

  const handleDeleteEvent = (id: string) => {
    setIsSaving(true);
    deleteEvent(id, {
      onSuccess: () => { setIsModalOpen(false); setIsSaving(false); },
      onError: () => setIsSaving(false)
    });
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Lade Stundenplan...</div>;

  const deadlineTasks = tasks.filter(t => t.due_date && t.status !== "DONE");

  // Conflict handling simple
  // Check overlapping events
  const getEventStyle = (evt: Event, allEvents: Event[]) => {
    const rowStart = timeToRow(evt.start_time);
    const rowEnd = timeToRow(evt.end_time);

    let overlaps = 0;
    let rank = 0;
    
    // basic google cal layout solver
    const sameDay = allEvents.filter(e => e.day_of_week === evt.day_of_week && !e.is_hidden);
    for (const other of sameDay) {
        if (other.id === evt.id) continue;
        const oStart = timeToRow(other.start_time);
        const oEnd = timeToRow(other.end_time);
        // Overlap condition
        if (rowStart < oEnd && oStart < rowEnd) {
            overlaps++;
            if (other.id < evt.id) rank++;
        }
    }

    if (overlaps === 0) return {};
    return {
        width: `${100 / (overlaps + 1)}%`,
        marginLeft: `${rank * (100 / (overlaps + 1))}%`
    };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
            <input type="checkbox" checked={showGhosts} onChange={e => setShowGhosts(e.target.checked)} className="rounded" />
            Geister-Blöcke (ausgeblendet) anzeigen
          </label>
        </div>
      </div>

      <div className="hidden md:block flex-1 overflow-y-auto border rounded-xl bg-card shadow-sm relative">
        <div 
          className="min-w-[800px]" 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "60px repeat(5, 1fr)",
            gridTemplateRows: `40px repeat(${TOTAL_ROWS}, minmax(18px, 1fr))`
          }}
        >
          {/* Header Row */}
          <div className="border-b border-r bg-muted/30 sticky top-0 z-20"></div>
          {DAYS.map((day, i) => (
             <div key={day} className="border-b border-r bg-muted/30 p-2 text-center font-medium sticky top-0 z-20 text-sm">
              {day}
            </div>
          ))}

          {/* Time Labels (Y-Axis) */}
          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
             <div 
              key={i} 
              className="border-r border-b border-dashed text-xs text-muted-foreground text-right pr-2 pt-1"
              style={{ gridRow: `${i * 4 + 2} / span 4`, gridColumn: 1 }}
            >
              {(START_HOUR + i).toString().padStart(2, "0")}:00
            </div>
          ))}

          {/* Empty Grid Cells */}
          {Array.from({ length: 5 }).map((_, colI) => (
             Array.from({ length: TOTAL_ROWS }).map((_, rowI) => (
               <div
                 key={`empty-${colI}-${rowI}`}
                 className="border-r border-b border-dashed opacity-0 hover:opacity-100 hover:bg-primary/5 cursor-pointer transition-colors"
                 style={{ gridRow: rowI + 2, gridColumn: colI + 2 }}
                 onClick={() => handleSlotClick(colI, rowI + 1)}
               ></div>
             ))
          ))}

          {/* Events */}
          {events.map((evt) => {
            if (evt.is_hidden && !showGhosts) return null;
            
            // Calculate pseudo day_of_week for non-recurring events
            let dayIdx = evt.day_of_week;
            if (dayIdx === null && evt.event_date) {
               const dateObj = new Date(evt.event_date);
               dayIdx = dateObj.getDay() - 1;
               if (dayIdx === -1) dayIdx = 6;
            }
            
            if (dayIdx === null || dayIdx > 4) return null;
            
            const rowStart = timeToRow(evt.start_time);
            const rowEnd = timeToRow(evt.end_time);
            const conflictStyle = getEventStyle(evt, events);
            
            let colorClass = "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200";
            if (evt.event_type === "WORK") {
                colorClass = "bg-orange-500/10 border-orange-500/30 text-orange-800 dark:text-orange-200";
            } else if (evt.event_type === "LIFE") {
                colorClass = "bg-purple-500/10 border-purple-500/30 text-purple-800 dark:text-purple-200";
            } else if (["EXERCISE", "TUTORIAL", "PRACTICUM", "SEMINAR"].includes(evt.event_type)) {
                colorClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200";
            } else if (evt.event_type === "FOCUS") {
                colorClass = "bg-amber-500/20 border-amber-500/50 text-amber-900 dark:text-amber-100 font-bold border-2 shadow-[0_0_10px_rgba(245,158,11,0.3)]";
            } else if (evt.event_type === "EXAM") {
                colorClass = "bg-red-500/10 border-red-500/40 text-red-800 dark:text-red-200 font-bold border-2";
            }

            return (
              <div
                key={evt.id}
                onClick={(e) => handleEventClick(e, evt)}
                className={`m-[1px] p-2 rounded-md border text-xs overflow-hidden cursor-pointer hover:shadow-md transition-all z-10 
                  ${colorClass}
                  ${evt.is_hidden ? "opacity-40 border-dashed" : ""}
                `}
                style={{ 
                  gridRow: `${rowStart + 1} / ${rowEnd + 1}`, 
                  gridColumn: dayIdx + 2,
                  ...conflictStyle
                }}
              >
                <div className="font-semibold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                  {evt.event_type === "FOCUS" && <span className="mr-1">🎧</span>}
                  {evt.title} {evt.is_recurring === false && " (Block)"}
                </div>
                {evt.location && (
                  <div className="font-bold text-[10px] mt-1 opacity-90">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {evt.location}
                  </div>
                )}
                <div className="text-[9px] opacity-70 mt-1 flex justify-between items-center pr-1">
                  <span>{evt.start_time?.substring(0, 5)} - {evt.end_time?.substring(0, 5)}</span>
                  {evt.lecturer && <span>👨‍🏫 {evt.lecturer.split(" ")[0]}</span>}
                </div>
              </div>
            );
          })}

          {/* Kanban Deadline Injections */}
          {deadlineTasks.map((task) => {
            const date = new Date(task.due_date!);
            let dayIdx = date.getDay() - 1;
            if (dayIdx === -1) dayIdx = 6;
            if (dayIdx > 4) return null; 

            const h = date.getHours();
            const m = date.getMinutes();
            if (h < START_HOUR || h >= END_HOUR) return null;

            const row = timeToRow(`${h}:${m}`);

            return (
               <div 
                key={`task-${task.id}`}
                className="z-20 h-0.5 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] relative -mt-[1px] pointer-events-none"
                style={{ gridRow: row + 1, gridColumn: dayIdx + 2 }}
              >
                <div className="absolute top-1 right-1 text-[9px] bg-red-600/90 backdrop-blur-sm text-white px-1 rounded-sm whitespace-nowrap shadow-sm">
                  Deadline: {task.title}
                </div>
              </div>
            );
          })}

          {/* Current Time Indicator Red Line */}
          {currentTimeRow !== null && (
             <div 
              className="z-30 h-0.5 bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)] relative w-full pointer-events-none -mt-[1px]"
              style={{ gridRow: Math.floor(currentTimeRow) + 1, gridColumn: "2 / span 5" }}
            >
              <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
            </div>
          )}

        </div>
      </div>

      <div className="md:hidden flex-1 overflow-y-auto pt-4">
        <MobileAgendaView events={events} onEventClick={handleEventClick} showGhosts={showGhosts} />
      </div>

      {isModalOpen && (
        <EventModal
          event={selectedEvent}
          initialDate={initialDateSlot || undefined}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          isSaving={isSaving}
          semesterTag={semesterTag}
          collisionWarning={collisionWarning}
        />
      )}
    </div>
  );
}
