export type StudiengangStatus = "PLANNED" | "REGISTERED" | "PASSED" | "FAILED";
export type ModulTyp = "PFLICHT" | "WAHLPFLICHT" | "ERGAENZEND";

export interface UniversityResponse {
  id: string;
  name: string;
  kuerzel: string;
  stadt: string;
  bundesland: string;
  typ: string;
}

export interface FacultyResponse {
  id: string;
  university_id: string;
  name: string;
  kuerzel: string;
}

export interface ProgramResponse {
  id: string;
  faculty_id: string;
  name: string;
  abschluss: string;
  regelstudienzeit: number;
  gesamt_ects: number;
}

export interface ExamRegulationResponse {
  id: string;
  program_id: string;
  version: string;
  gueltig_ab: string | null;
  ist_aktuell: boolean;
}

export interface ModuleResponse {
  id: string;
  exam_regulation_id: string;
  name: string;
  kuerzel: string | null;
  ects: number;
  semester_empfehlung: number | null;
  modul_typ: ModulTyp;
  ist_benotet: boolean;
  max_versuche: number;
  gewichtung: number;
  has_prerequisites: boolean;
  /** PX | EA | R | BAA+Ko — null for non-BIN or unset modules (ADR-018) */
  pruefungsart: string | null;
  /** Semesterwochenstunden — null for project/thesis modules */
  sws: number | null;
}

export interface StudentModuleResponse {
  id: string;
  user_id: string;
  module_id: string | null;
  custom_name: string | null;
  custom_ects: number | null;
  status: StudiengangStatus;
  note: number | null;
  versuch_nummer: number;
  anmelde_datum: string | null;
  pruefungs_datum: string | null;
  /** Administrative semester — used by ModuleList (/modules). Never written by StudyPlanBoard. */
  semester: string | null;
  /** StudyPlanBoard-only planning semester. null = auto-position via semester_empfehlung. */
  plan_semester: string | null;
  /** null for catalogue modules (use module.ist_benotet). Set for custom ERGAENZEND modules. */
  custom_ist_benotet: boolean | null;
  module: ModuleResponse | null;
}

export interface StudentModulesBySemester {
  semester: number | null;
  modules: StudentModuleResponse[];
}

export interface StatsResponse {
  gpa: number | null;
  erreichte_ects: number;
  gesamt_ects: number;
  fortschritt_prozent: number;
  bestandene_module: number;
  nicht_bestandene_module: number;
  offene_module: number;
}

export interface UserProgramResponse {
  id: string;
  user_id: string;
  exam_regulation_id: string;
  start_semester: string;
  created_at: string;
  exam_regulation: ExamRegulationResponse;
  program: ProgramResponse;
}
