export interface AdminFaculty {
  id: string;
  name: string;
  kuerzel: string;
  university_id: string;
}

export interface AdminUniversity {
  id: string;
  name: string;
  kuerzel: string;
  stadt: string | null;
  bundesland: string | null;
  typ: string;
}

export interface AdminUniversityDetail extends AdminUniversity {
  faculties: AdminFaculty[];
}

export interface AdminProgram {
  id: string;
  name: string;
  abschluss: string;
  regelstudienzeit: number;
  gesamt_ects: number;
  faculty_id: string;
  is_archived: boolean;
  archive_reason: string | null;
}

export interface AdminExamReg {
  id: string;
  version: string;
  gueltig_ab: string | null;
  ist_aktuell: boolean;
  is_archived: boolean;
  program_id: string;
  program_name?: string;
  archive_reason?: string | null;
}

export interface AdminProgramDetail extends AdminProgram {
  student_count: number;
  exam_regulations: AdminExamReg[];
}

export interface AdminExamRegDetail extends AdminExamReg {
  module_count: number;
}

export interface AdminModule {
  id: string;
  name: string;
  kuerzel: string | null;
  ects: number;
  semester_empfehlung: number | null;
  modul_typ: "PFLICHT" | "WAHLPFLICHT" | "ERGAENZEND";
  ist_benotet: boolean;
  max_versuche: number;
  gewichtung: number;
  has_prerequisites: boolean;
  pruefungsart: string | null;
  sws: number | null;
  is_archived: boolean;
  exam_regulation_id: string;
}

export interface AdminPrerequisite {
  id: string;
  module_id: string;
  prerequisite_type: "MODULE" | "ECTS_THRESHOLD" | "SEMESTER_COMPLETE";
  description: string;
  required_module_id: string | null;
  minimum_ects: number | null;
  required_semesters: string[] | null;
}

export interface AdminModuleDetail extends AdminModule {
  student_count: number;
  prerequisites: AdminPrerequisite[];
}

export interface AdminUserListItem {
  id: string;
  email: string;
  full_name: string | null;
  matrikelnummer: string | null;
  is_active: boolean;
  is_premium: boolean;
  is_verified: boolean;
  is_admin: boolean;
  preferred_language: string;
  created_at: string;
  last_login_at: string | null;
  program_name: string | null;
  start_semester: string | null;
  total_modules: number;
  passed_modules: number;
  erreichte_ects: number;
}

export interface AdminUserListResponse {
  items: AdminUserListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AdminUserDetail extends AdminUserListItem {
  university: string | null;
  birth_date: string | null;
  admin_notes: string | null;
  gpa: number | null;
}

export interface AdminUserPatch {
  is_active?: boolean;
  is_premium?: boolean;
  is_verified?: boolean;
  admin_notes?: string;
}
