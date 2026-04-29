import { NextRequest, NextResponse } from "next/server";
import { BACKEND, bearerHeaders } from "@/lib/backend";

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/me/password`, {
      method: "PUT",
      headers: bearerHeaders(token),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
