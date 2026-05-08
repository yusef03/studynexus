import { NextRequest, NextResponse } from "next/server";
import { BACKEND, bearerHeaders } from "@/lib/backend";

function getToken(request: NextRequest) {
  return request.cookies.get("access_token")?.value;
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  const upstream = await fetch(`${BACKEND}/me`, {
    headers: bearerHeaders(token),
    cache: "no-store",
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function PUT(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    const upstream = await fetch(`${BACKEND}/me/profile`, {
      method: "PUT",
      headers: bearerHeaders(token),
      body: JSON.stringify(body),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
