"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "@/lib/adminFetch";
import type { AdminModule, AdminModuleDetail, AdminExamRegDetail } from "@/types/admin";

export function useAdminModules(params?: { exam_regulation_id?: string; include_archived?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.exam_regulation_id) qs.set("exam_regulation_id", params.exam_regulation_id);
  if (params?.include_archived) qs.set("include_archived", "true");

  return useQuery<AdminModule[]>({
    queryKey: ["admin-modules", params?.exam_regulation_id, params?.include_archived],
    queryFn: () => adminGet<AdminModule[]>(`modules?${qs}`),
    staleTime: 30_000,
  });
}

export function useAdminModule(id: string) {
  return useQuery<AdminModuleDetail>({
    queryKey: ["admin-module", id],
    queryFn: () => adminGet<AdminModuleDetail>(`modules/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useAdminExamReg(id: string) {
  return useQuery<AdminExamRegDetail>({
    queryKey: ["admin-exam-reg", id],
    queryFn: () => adminGet<AdminExamRegDetail>(`exam-regulations/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}
