"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TaskModal } from "@/components/kanban/TaskModal";
import { EventModal } from "@/components/schedule/EventModal";
import { useTasks } from "@/hooks/queries/useTasks";
import { useEvents } from "@/hooks/queries/useEvents";
import { Task } from "@/types/task";
import type { UserProgramResponse } from "@/types/study";
import { Plus, BookOpen, Calendar, Clock, X } from "lucide-react";
import { useTranslations } from "next-intl";

export function MobileQuickAdd() {
  const t = useTranslations("dashboard.widgets.quickAdd");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"NONE" | "TASK" | "SUBMISSION" | "EVENT">("NONE");
  const { createTask } = useTasks();
  const { createEvent } = useEvents();
  const [isSaving, setIsSaving] = useState(false);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);

  const { data: programData } = useQuery<UserProgramResponse, Error>({
    queryKey: ["userProgram"],
    queryFn: async () => {
      const res = await fetch("/api/study/program");
      if (!res.ok) throw new Error("No program");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const semesterTag = programData?.start_semester ?? "";

  // Phase 5: Only show FAB on pages where it makes sense
  const hiddenPaths = ["/settings", "/profile", "/setup"];
  const shouldHide = hiddenPaths.some(p => pathname.includes(p));
  if (shouldHide) return null;

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
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Menu Items */}
        {isOpen && (
          <div className="flex flex-col gap-3 mb-4 items-end animate-in slide-in-from-bottom-5 fade-in duration-200">
            <button onClick={() => setModalType("SUBMISSION")} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-lg border border-blue-500/20 active:scale-95 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium bg-background/80 px-2 py-0.5 rounded-full">{t("newModule")}</span>
            </button>

            <button onClick={() => setModalType("TASK")} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-lg border border-orange-500/20 active:scale-95 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium bg-background/80 px-2 py-0.5 rounded-full">{t("studySession")}</span>
            </button>

            <button onClick={() => setModalType("EVENT")} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shadow-lg border border-red-500/20 active:scale-95 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium bg-background/80 px-2 py-0.5 rounded-full">{t("examDate")}</span>
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
          semesterTag={semesterTag}
          collisionWarning={collisionWarning} 
        />
      )}
    </>
  );
}
