"use client";

import { useState } from "react";
import { TaskModal } from "@/components/kanban/TaskModal";
import { EventModal } from "@/components/schedule/EventModal";
import { useTasks } from "@/hooks/queries/useTasks";
import { useEvents } from "@/hooks/queries/useEvents";
import { Task } from "@/types/task";

export function MobileQuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"NONE" | "TASK" | "SUBMISSION" | "EVENT">("NONE");
  
  const { createTask } = useTasks();
  const { createEvent } = useEvents();
  const [isSaving, setIsSaving] = useState(false);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);

  const handleTaskSave = (id: string, payload: any) => {
    setIsSaving(true);
    createTask(
      { 
        title: payload.title, 
        description: payload.description, 
        status: payload.status || "TODO", 
        priority: payload.priority, 
        due_date: payload.due_date, 
        module_id: payload.module_id,
        is_submission: payload.is_submission
      },
      { 
        onSuccess: () => {
          setIsSaving(false);
          setModalType("NONE");
          setIsOpen(false);
        },
        onError: () => setIsSaving(false)
      }
    );
  };

  const handleEventSave = (id: string | null, payload: any, force: boolean) => {
    setIsSaving(true);
    setCollisionWarning(null);
    createEvent({ payload, force }, {
      onSuccess: () => { 
        setIsSaving(false); 
        setModalType("NONE"); 
        setIsOpen(false); 
      },
      onError: (err: any) => {
        setIsSaving(false);
        if (err.message === "Collision detected") {
          const parts = err.collisionData?.split("|COLLISION|");
          setCollisionWarning(`Überschneidet sich mit "${parts ? parts[1] : 'einem Event'}".`);
        }
      }
    });
  };

  const dummyTask: Task = {
    id: "",
    title: "",
    description: null,
    status: "TODO",
    priority: "MEDIUM",
    position: 0,
    due_date: null,
    module_id: null,
    is_submission: modalType === "SUBMISSION",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "",
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 md:hidden flex flex-col items-end">
        {/* Menu Items */}
        {isOpen && (
          <div className="flex flex-col gap-3 mb-4 items-end animate-in slide-in-from-bottom-5 fade-in duration-200">
            <button 
              onClick={() => setModalType("SUBMISSION")}
              className="flex items-center gap-3 bg-card border shadow-lg px-4 py-2.5 rounded-full font-medium text-sm text-foreground active:scale-95 transition-transform"
            >
              <span>Abgabe</span>
              <span className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400 w-8 h-8 rounded-full flex items-center justify-center">📄</span>
            </button>
            <button 
              onClick={() => setModalType("TASK")}
              className="flex items-center gap-3 bg-card border shadow-lg px-4 py-2.5 rounded-full font-medium text-sm text-foreground active:scale-95 transition-transform"
            >
              <span>Aufgabe</span>
              <span className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center">📝</span>
            </button>
            <button 
              onClick={() => setModalType("EVENT")}
              className="flex items-center gap-3 bg-card border shadow-lg px-4 py-2.5 rounded-full font-medium text-sm text-foreground active:scale-95 transition-transform"
            >
              <span>Termin</span>
              <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400 w-8 h-8 rounded-full flex items-center justify-center">📅</span>
            </button>
          </div>
        )}

        {/* FAB Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all active:scale-95 z-50 ${isOpen ? 'bg-zinc-800 dark:bg-zinc-200 dark:text-black rotate-45' : 'bg-primary'}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M12 5v14M5 12h14" />
            )}
          </svg>
        </button>
      </div>

      {/* Modals */}
      {(modalType === "TASK" || modalType === "SUBMISSION") && (
        <TaskModal 
          task={dummyTask} 
          onClose={() => setModalType("NONE")} 
          onSave={handleTaskSave} 
          onDelete={() => {}} 
          isSaving={isSaving} 
        />
      )}

      {modalType === "EVENT" && (
        <EventModal 
          event={null} 
          onClose={() => setModalType("NONE")} 
          onSave={handleEventSave} 
          onDelete={() => {}} 
          isSaving={isSaving} 
          semesterTag="WiSe2425" 
          collisionWarning={collisionWarning} 
        />
      )}
    </>
  );
}
