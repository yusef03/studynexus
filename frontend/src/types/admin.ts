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
