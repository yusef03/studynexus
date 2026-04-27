import { NextRequest, NextResponse } from "next/server";
import { BACKEND, bearerHeaders } from "@/lib/backend";

function getToken(request: NextRequest) {
  return request.cookies.get("access_token")?.value;
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const semester = searchParams.get("semester_tag");
  const query = semester ? `?semester_tag=${semester}` : "";

  const upstream = await fetch(`${BACKEND}/mission/events/${query}`, {
    headers: bearerHeaders(token),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";
  const query = force ? `?force=true` : "";

  const body = await request.json();
  const upstream = await fetch(`${BACKEND}/mission/events/${query}`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(body),
  });
  
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
