/**
 * Thin fetch wrapper for /api/admin/* proxy routes.
 * Automatically sets Content-Type and forwards admin-token when provided.
 */

export async function adminGet<T>(path: string): Promise<T> {
  const cleanPath = path.replace(/^\/?(admin\/)?/, "");
  const res = await fetch(`/api/admin/${cleanPath}`);
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<T>;
}

export async function adminMutate<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE" | "PUT",
  options: { body?: unknown; adminToken?: string } = {}
): Promise<T | undefined> {
  const cleanPath = path.replace(/^\/?(admin\/)?/, "");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.adminToken) headers["x-admin-token"] = options.adminToken;

  const res = await fetch(`/api/admin/${cleanPath}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined;
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<T>;
}
