"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "@/lib/adminFetch";
import type { AdminSystemInfo, AdminSystemHealth } from "@/types/admin";

export function useAdminSystemInfo() {
  return useQuery<AdminSystemInfo>({
    queryKey: ["admin-system-info"],
    queryFn: () => adminGet<AdminSystemInfo>("system"),
    staleTime: 60_000,
  });
}

export function useAdminSystemHealth() {
  return useQuery<AdminSystemHealth>({
    queryKey: ["admin-system-health"],
    queryFn: () => adminGet<AdminSystemHealth>("system/health"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
