"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdminUserDetail } from "@/types/admin";

export function useAdminUser(id: string) {
  return useQuery<AdminUserDetail>({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}
