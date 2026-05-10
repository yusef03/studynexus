"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "@/lib/adminFetch";
import type { AdminUniversity, AdminUniversityDetail } from "@/types/admin";

export function useAdminUniversities() {
  return useQuery<AdminUniversity[]>({
    queryKey: ["admin-universities"],
    queryFn: () => adminGet<AdminUniversity[]>("universities"),
    staleTime: 60_000,
  });
}

export function useAdminUniversity(id: string) {
  return useQuery<AdminUniversityDetail>({
    queryKey: ["admin-university", id],
    queryFn: () => adminGet<AdminUniversityDetail>(`universities/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}
