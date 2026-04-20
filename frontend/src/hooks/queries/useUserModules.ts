"use client";

import { useQuery } from "@tanstack/react-query";
import type { StudentModulesBySemester } from "@/types/study";

export function useUserModules() {
  return useQuery<StudentModulesBySemester[], Error>({
    queryKey: ["userModules"],
    queryFn: async () => {
      const res = await fetch("/api/study/modules");
      if (!res.ok) {
        throw new Error("Failed to fetch user modules");
      }
      return res.json();
    },
  });
}
