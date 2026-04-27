"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Task, TaskPriority, TaskStatus, TaskUpdate } from "@/types/task";
import { useUserModules } from "@/hooks/queries/useUserModules";

const selectClass = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
  "text-sm ring-offset-background",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

const textareaClass = cn(
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2",
  "text-sm ring-offset-background placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

interface Props {
  task: Task;
  onClose: () => void;
  onSave: (id: string, payload: TaskUpdate) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
}

export function TaskModal({ task, onClose, onSave, onDelete, isSaving }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split("T")[0] : "");
  const [moduleId, setModuleId] = useState(task.module_id || "");
  const [isSubmission, setIsSubmission] = useState(task.is_submission || false);

  const { data: modulesBySemester } = useUserModules();
  
  // Flatten student modules for the dropdown
  const allModules = modulesBySemester 
    ? modulesBySemester.flatMap(group => group.modules)
    : [];

  const handleSave = () => {
    onSave(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      module_id: moduleId || null,
      is_submission: isSubmission,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg rounded-xl border bg-background shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{task.id ? "Aufgabe bearbeiten" : "Neuer Task"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="px-6 py-6 space-y-5 overflow-y-auto">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Titel</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Mathe Übung 3..." />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Beschreibung / Notizen</Label>
            <textarea
              className={textareaClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Füge Notizen oder Details hinzu..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-1.5">
              <Label>Spalte (Status)</Label>
              <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="EXAM_READY">Exam Ready</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label>Priorität</Label>
              <select className={selectClass} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="space-y-1.5">
              <Label>Fälligkeitsdatum</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              
              <div className="flex items-center gap-2 mt-2 pt-1">
                <input 
                  type="checkbox" 
                  id="is_submission" 
                  checked={isSubmission} 
                  onChange={(e) => setIsSubmission(e.target.checked)} 
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="is_submission" className="text-xs font-medium cursor-pointer">
                  Ist eine Abgabe / Hausarbeit 📄
                </label>
              </div>
            </div>

            {/* Module Link */}
            <div className="space-y-1.5">
              <Label>Studienmodul verknüpfen</Label>
              <select className={selectClass} value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
                <option value="">-- Kein Modul --</option>
                {allModules.map(sm => (
                  <option key={sm.id} value={sm.id}>
                    {sm.module?.name || sm.custom_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center border-t px-6 py-4 bg-muted/20">
          <div>
            {task.id && (
              <Button variant="destructive" onClick={() => onDelete(task.id)} disabled={isSaving}>
                Löschen
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
              {isSaving ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
