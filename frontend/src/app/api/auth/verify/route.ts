import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const upstream = await fetch(`${BACKEND}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
