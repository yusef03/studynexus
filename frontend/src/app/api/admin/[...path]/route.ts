import { NextRequest, NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

type Ctx = { params: { path: string[] } };

async function handler(request: NextRequest, { params }: Ctx) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const path = params.path.join("/");
  const qs = request.nextUrl.searchParams.toString();
  const url = `${BACKEND}/admin/${path}${qs ? `?${qs}` : ""}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Forward admin session token for destructive operations
  const adminToken = request.headers.get("x-admin-token");
  if (adminToken) headers["X-Admin-Token"] = adminToken;

  const init: RequestInit = { method: request.method, headers };

  if (!["GET", "HEAD"].includes(request.method)) {
    const text = await request.text();
    if (text) init.body = text;
  }

  const upstream = await fetch(url, init);

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  // Try JSON, fall back to empty object for unexpected bodies
  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: upstream.status });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
export const PUT = handler;
