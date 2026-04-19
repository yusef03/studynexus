"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  FacultyResponse,
  ProgramResponse,
  ExamRegulationResponse,
  UniversityResponse,
} from "@/types/study";

const SEMESTER_OPTIONS = [
  "WS2022/23", "SoSe2023",
  "WS2023/24", "SoSe2024",
  "WS2024/25", "SoSe2025",
  "WS2025/26", "SoSe2026",
];

const selectClass = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
  "text-sm ring-offset-background",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export default function SetupPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("dashboard.setup");
  const router = useRouter();

  const [university, setUniversity] = useState<UniversityResponse | null>(null);
  const [faculties, setFaculties] = useState<FacultyResponse[]>([]);
  const [programs, setPrograms] = useState<ProgramResponse[]>([]);
  const [examRegs, setExamRegs] = useState<ExamRegulationResponse[]>([]);

  const [facultyId, setFacultyId] = useState("");
  const [programId, setProgramId] = useState("");
  const [examRegId, setExamRegId] = useState("");
  const [startSemester, setStartSemester] = useState("");

  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // ── Effect 1: redirect if program already selected ────────────────────────
  // Deps: [] — run ONCE on mount only.
  // router/locale must NOT be deps: calling router.replace updates the router
  // store, causing a re-render that would re-fire this effect in a tight loop.
  useEffect(() => {
    fetch("/api/study/program").then((res) => {
      if (res.ok) router.replace(`/${locale}/dashboard`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effect 2: load the university list ────────────────────────────────────
  // Deps: [] — run ONCE on mount only.
  // On success sets `university`; failure shows error and ends initializing.
  // The faculties fetch is intentionally separate (Effect 3) so deps remain
  // stable and the two fetches cannot form a circular dependency chain.
  useEffect(() => {
    fetch("/api/universities")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<UniversityResponse[]>;
      })
      .then((unis) => {
        const hsh = unis[0];
        if (!hsh) throw new Error();
        setUniversity(hsh);
      })
      .catch(() => {
        setLoadError(t("loadError"));
        setInitializing(false); // faculties effect won't run, so stop here
      });
    // t is a stable reference from next-intl; excluded intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effect 3: load faculties when university is known ─────────────────────
  // Deps: [university?.id] — a string primitive so Object.is comparison is
  // stable; avoids re-running when the university object reference changes
  // (e.g. React StrictMode double-invoke) while the actual id is the same.
  useEffect(() => {
    if (!university) return;
    fetch(`/api/universities/${university.id}/faculties`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<FacultyResponse[]>;
      })
      .then(setFaculties)
      .catch(() => setLoadError(t("loadError")))
      .finally(() => setInitializing(false));
    // t is stable; excluded intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [university?.id]);

  // ── Effect 4: load programs when faculty selection changes ─────────────────
  // Deps: [facultyId] only — no t, no router, no locale.
  useEffect(() => {
    if (!facultyId) {
      setPrograms([]);
      setProgramId("");
      setExamRegs([]);
      setExamRegId("");
      return;
    }
    fetch(`/api/faculties/${facultyId}/programs`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: ProgramResponse[]) => {
        setPrograms(data);
        setProgramId("");
        setExamRegs([]);
        setExamRegId("");
      })
      .catch(() => setLoadError(t("loadError")));
    // t is stable; excluded intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facultyId]);

  // ── Effect 5: load exam regulations when program selection changes ─────────
  // Deps: [programId] only — no t, no router, no locale.
  useEffect(() => {
    if (!programId) {
      setExamRegs([]);
      setExamRegId("");
      return;
    }
    fetch(`/api/programs/${programId}/exam-regulations`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: ExamRegulationResponse[]) => {
        setExamRegs(data);
        setExamRegId("");
      })
      .catch(() => setLoadError(t("loadError")));
    // t is stable; excluded intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const canConfirm = examRegId && startSemester;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/study/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_regulation_id: examRegId, start_semester: startSemester }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.detail ?? t("saveError"));
        return;
      }
      // router.replace prevents back-navigation to setup after completion
      router.replace(`/${locale}/dashboard`);
    } catch {
      setSaveError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (initializing) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        {loadError && (
          <p className="mb-4 text-sm text-destructive" role="alert">{loadError}</p>
        )}

        <div className="rounded-lg border bg-card p-6 space-y-5">
          {/* University (auto-selected, read-only) */}
          <div className="space-y-1.5">
            <Label>{t("university")}</Label>
            <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
              {university?.name ?? "Hochschule Hannover"}
            </div>
          </div>

          {/* Faculty */}
          <div className="space-y-1.5">
            <Label htmlFor="setup-faculty">{t("faculty")}</Label>
            <select
              id="setup-faculty"
              className={selectClass}
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
            >
              <option value="">{t("selectFaculty")}</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Program */}
          <div className="space-y-1.5">
            <Label htmlFor="setup-program">{t("program")}</Label>
            <select
              id="setup-program"
              className={selectClass}
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              disabled={!facultyId || programs.length === 0}
            >
              <option value="">{t("selectProgram")}</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.abschluss})
                </option>
              ))}
            </select>
          </div>

          {/* Exam regulation */}
          <div className="space-y-1.5">
            <Label htmlFor="setup-examreg">{t("examReg")}</Label>
            <select
              id="setup-examreg"
              className={selectClass}
              value={examRegId}
              onChange={(e) => setExamRegId(e.target.value)}
              disabled={!programId || examRegs.length === 0}
            >
              <option value="">{t("selectExamReg")}</option>
              {examRegs.map((er) => (
                <option key={er.id} value={er.id}>
                  {er.version}
                </option>
              ))}
            </select>
          </div>

          {/* Start semester */}
          <div className="space-y-1.5">
            <Label htmlFor="setup-semester">{t("startSemester")}</Label>
            <select
              id="setup-semester"
              className={selectClass}
              value={startSemester}
              onChange={(e) => setStartSemester(e.target.value)}
              disabled={!examRegId}
            >
              <option value="">{t("selectSemester")}</option>
              {SEMESTER_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {saveError && (
            <p className="text-sm text-destructive" role="alert">{saveError}</p>
          )}

          <Button
            className="w-full"
            onClick={handleConfirm}
            disabled={!canConfirm || saving}
          >
            {saving ? t("saving") : t("confirm")}
          </Button>
        </div>
      </div>
    </main>
  );
}
