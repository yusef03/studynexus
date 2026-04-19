import { NextRequest, NextResponse } from "next/server";
import { BACKEND, bearerHeaders } from "@/lib/backend";

function getToken(request: NextRequest) {
  return request.cookies.get("access_token")?.value;
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  const upstream = await fetch(`${BACKEND}/me/program`, {
    headers: bearerHeaders(token),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const upstream = await fetch(`${BACKEND}/me/program`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
