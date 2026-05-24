"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "@/lib/adminFetch";
import type { AdminFaculty } from "@/types/admin";

export function useAdminFaculties() {
  return useQuery<AdminFaculty[]>({
    queryKey: ["admin-faculties"],
    queryFn: () => adminGet<AdminFaculty[]>("faculties"),
    staleTime: 60_000,
  });
}
