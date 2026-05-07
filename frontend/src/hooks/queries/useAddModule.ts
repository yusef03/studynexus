"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StudentModuleResponse } from "@/types/study";

interface AddPayload {
  module_id?: string;
  custom_name?: string;
  custom_ects?: number;
  custom_ist_benotet?: boolean;
}

export function useAddModule() {
  const queryClient = useQueryClient();

  return useMutation<StudentModuleResponse, Error, AddPayload>({
    mutationFn: async (body) => {
      const res = await fetch("/api/study/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-studynexus-client": "true" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to add module");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userModules"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
}
