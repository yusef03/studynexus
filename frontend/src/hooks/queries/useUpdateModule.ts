"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StudentModuleResponse, StudiengangStatus } from "@/types/study";

interface UpdatePayload {
  id: string;
  status: StudiengangStatus;
  note?: number;
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation<StudentModuleResponse, Error, UpdatePayload>({
    mutationFn: async ({ id, ...body }) => {
      const res = await fetch(`/api/study/modules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-studynexus-client": "true" },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        // Token expired – force re-login
        window.location.href = "/login";
        throw new Error("Sitzung abgelaufen. Bitte erneut anmelden.");
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update module");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userModules"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
}
