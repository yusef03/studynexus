"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "@/lib/adminFetch";
import type { AdminAuditLog, AdminAuditLogListResponse } from "@/types/admin";

export interface AdminAuditLogParams {
  page: number;
  page_size?: number;
  entity_type?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
}

export function useAdminAuditLogs(params: AdminAuditLogParams) {
  const qs = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size ?? 25),
  });
  if (params.entity_type) qs.set("entity_type", params.entity_type);
  if (params.action) qs.set("action", params.action);
  if (params.date_from) qs.set("date_from", params.date_from);
  if (params.date_to) qs.set("date_to", params.date_to);

  return useQuery<AdminAuditLogListResponse>({
    queryKey: [
      "admin-audit-log",
      params.page,
      params.page_size,
      params.entity_type,
      params.action,
      params.date_from,
      params.date_to,
    ],
    queryFn: () => adminGet<AdminAuditLogListResponse>(`audit-log?${qs}`),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

export function useAdminAuditLogEntry(id: string) {
  return useQuery<AdminAuditLog>({
    queryKey: ["admin-audit-log-entry", id],
    queryFn: () => adminGet<AdminAuditLog>(`audit-log/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}
