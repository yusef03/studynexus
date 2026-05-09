"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdminUserListResponse } from "@/types/admin";

export interface AdminUsersParams {
  page: number;
  search: string;
  is_active?: boolean;
  is_premium?: boolean;
  is_verified?: boolean;
  limit?: number;
}

export function useAdminUsers(params: AdminUsersParams) {
  const { page, search, is_active, is_premium, is_verified, limit = 25 } = params;

  return useQuery<AdminUserListResponse>({
    queryKey: ["admin-users", page, search, is_active, is_premium, is_verified, limit],
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(page), page_size: String(limit) });
      if (search) qs.set("search", search);
      if (is_active !== undefined) qs.set("is_active", String(is_active));
      if (is_premium !== undefined) qs.set("is_premium", String(is_premium));
      if (is_verified !== undefined) qs.set("is_verified", String(is_verified));

      const res = await fetch(`/api/admin/users?${qs}`);
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
