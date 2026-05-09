"use client";

import { useQuery } from "@tanstack/react-query";
import type { UserProgramResponse } from "@/types/study";

export function useUserProgram() {
  return useQuery<UserProgramResponse | null, Error>({
    queryKey: ["userProgram"],
    queryFn: async () => {
      const res = await fetch("/api/study/program");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch program");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
