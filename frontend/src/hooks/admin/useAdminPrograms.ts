"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "@/lib/adminFetch";
import type { AdminProgram, AdminProgramDetail } from "@/types/admin";

export function useAdminPrograms(params?: { faculty_id?: string; include_archived?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.faculty_id) qs.set("faculty_id", params.faculty_id);
  if (params?.include_archived) qs.set("include_archived", "true");

  return useQuery<AdminProgram[]>({
    queryKey: ["admin-programs", params?.faculty_id, params?.include_archived],
    queryFn: () => adminGet<AdminProgram[]>(`programs?${qs}`),
    staleTime: 60_000,
  });
}

export function useAdminProgram(id: string) {
  return useQuery<AdminProgramDetail>({
    queryKey: ["admin-program", id],
    queryFn: () => adminGet<AdminProgramDetail>(`programs/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}
