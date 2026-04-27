"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Event, EventType, EventUpdate } from "@/types/event";
import { useUserModules } from "@/hooks/queries/useUserModules";

const selectClass = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
  "text-sm ring-offset-background",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

interface Props {
  event: Event | null;
  initialDate?: { day_of_week: number; start_time: string }; 
  onClose: () => void;
  onSave: (id: string | null, payload: EventUpdate, force: boolean) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
  semesterTag: string; // Passed from parent
  collisionWarning?: string | null;
}

export function EventModal({ event, initialDate, onClose, onSave, onDelete, isSaving, semesterTag, collisionWarning }: Props) {
  const [title, setTitle] = useState(event?.title || "");
  const [eventType, setEventType] = useState<EventType>(event?.event_type || "LECTURE");
  const [dayOfWeek, setDayOfWeek] = useState(event?.day_of_week ?? initialDate?.day_of_week ?? 0);
  const [eventDate, setEventDate] = useState(event?.event_date?.substring(0, 10) || "");
  const [startTime, setStartTime] = useState(event?.start_time?.substring(0, 5) || initialDate?.start_time || "10:00");
  const [endTime, setEndTime] = useState(event?.end_time?.substring(0, 5) || "11:30");
  const [location, setLocation] = useState(event?.location || "");
  const [lecturer, setLecturer] = useState(event?.lecturer || "");
  const [moduleId, setModuleId] = useState(event?.module_id || "");
  const [isRecurring, setIsRecurring] = useState(event?.is_recurring ?? true);
  const [isHidden, setIsHidden] = useState(event?.is_hidden ?? false);

  const { data: modulesBySemester } = useUserModules();
  
  // Smart Title Effect
  useEffect(() => {
    if (moduleId && modulesBySemester) {
      for (const group of modulesBySemester) {
        const mod = group.modules.find(m => m.id === moduleId);
        if (mod) {
          const modName = mod.module?.name || mod.custom_name;
          if (title === "" || title.length < 3) {
            setTitle(modName);
          }
          break;
        }
      }
    }
  }, [moduleId]);

  // Klausur Failsafe
  useEffect(() => {
    if (eventType === "EXAM") {
      setIsRecurring(false);
    }
  }, [eventType]);

  const handleSave = () => {
    // If there is a collision warning, it means user clicked "Demnach Speichern"
    const force = !!collisionWarning;

    onSave(event?.id || null, {
      title: title.trim(),
      event_type: eventType,
      semester_tag: semesterTag,
      day_of_week: isRecurring ? dayOfWeek : null,
      event_date: isRecurring ? null : (eventDate || null),
      start_time: startTime + ":00",
      end_time: endTime + ":00",
      location: location.trim() || null,
      lecturer: lecturer.trim() || null,
      module_id: moduleId || null,
      is_recurring: isRecurring,
      is_hidden: isHidden
    }, force);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg rounded-xl border bg-background shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{event ? "Block bearbeiten" : "Neuen Block erstellen"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="px-6 py-6 space-y-5 overflow-y-auto">
          {collisionWarning && (
            <div className="p-3 mb-4 rounded-md bg-yellow-500/10 border border-yellow-500/50 text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-bold flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Zeit-Konflikt!
              </span>
              <div className="mt-1 opacity-90">{collisionWarning}</div>
              <div className="mt-2 font-medium">Möchtest du trotzdem speichern?</div>
            </div>
          )}

          <div className="space-y-1.5">
             <Label>Titel</Label>
             <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Vorlesung Computergrafik" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Typ</Label>
              <select className={selectClass} value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
                <option value="LECTURE">Vorlesung</option>
                <option value="EXERCISE">Übung</option>
                <option value="TUTORIAL">Tutorium</option>
                <option value="SEMINAR">Seminar</option>
                <option value="PRACTICUM">Praktikum</option>
                <option value="CUSTOM_STUDY">Lern-Session</option>
                <option value="FOCUS" className="text-amber-600 font-bold">🎧 Fokuszeit / Deep Work</option>
                <option value="EXAM" className="text-red-500 font-bold">Klausur / Prüfung</option>
                <option value="WORK" className="text-orange-500">Nebenjob / Arbeit</option>
                <option value="LIFE" className="text-purple-500">Privates (Life)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Modul (Optional)</Label>
              <select className={selectClass} value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
                <option value="">-- Kein Modul --</option>
                {modulesBySemester?.map((group, idx) => (
                  <optgroup key={idx} label={`Semester ${group.semester ?? 'Frei/Wahl'}`}>
                    {group.modules.map((sm: any) => (
                      <option key={sm.id} value={sm.id}>
                        {sm.module?.name || sm.custom_name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-6 py-2 border-y border-dashed my-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input 
                type="checkbox" 
                checked={isRecurring} 
                onChange={e => setIsRecurring(e.target.checked)} 
                disabled={eventType === "EXAM"}
                className="rounded border-gray-300" 
              />
              Wöchentlich wiederholen
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
              <input type="checkbox" checked={isHidden} onChange={e => setIsHidden(e.target.checked)} className="rounded border-gray-300" />
              Ghosting (Versteckt)
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {isRecurring ? (
                <>
                  <Label>Wochentag</Label>
                  <select className={selectClass} value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
                    <option value={0}>Montag</option>
                    <option value={1}>Dienstag</option>
                    <option value={2}>Mittwoch</option>
                    <option value={3}>Donnerstag</option>
                    <option value={4}>Freitag</option>
                    <option value={5}>Samstag</option>
                    <option value={6}>Sonntag</option>
                  </select>
                </>
              ) : (
                <>
                  <Label>Spezifisches Datum</Label>
                  <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                </>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Von</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Bis</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Ort / Raum</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="z. B. Geb. 1, R. 238" />
            </div>
            <div className="space-y-1.5">
              <Label>Dozent/in</Label>
              <Input value={lecturer} onChange={(e) => setLecturer(e.target.value)} placeholder="z. B. Prof. Müller" />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center border-t px-6 py-4 bg-muted/20">
          <div>
            {event && (
              <Button variant="destructive" onClick={() => onDelete(event.id)} disabled={isSaving}>
                Löschen
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={isSaving || !title.trim() || (!isRecurring && !eventDate)}>
              {isSaving ? "Speichert..." : (collisionWarning ? "Trotzdem Speichern" : "Speichern")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
