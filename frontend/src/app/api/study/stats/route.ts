import { NextRequest, NextResponse } from "next/server";
import { BACKEND, bearerHeaders } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  const upstream = await fetch(`${BACKEND}/me/stats`, {
    headers: bearerHeaders(token),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
