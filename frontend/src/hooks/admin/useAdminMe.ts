import { useQuery } from "@tanstack/react-query";
import { adminGet } from "@/lib/adminFetch";

export function useAdminMe() {
  return useQuery({
    queryKey: ["admin-me"],
    queryFn: () => adminGet<{ id: string }>("auth/me"),
    staleTime: 60 * 1000,
  });
}
