"use client";

import { useQuery } from "@tanstack/react-query";
import type { StatsResponse } from "@/types/study";

export function useUserStats() {
  return useQuery<StatsResponse, Error>({
    queryKey: ["userStats"],
    queryFn: async () => {
      const res = await fetch("/api/study/stats");
      if (!res.ok) {
        throw new Error("Failed to fetch user stats");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
