import { NextRequest, NextResponse } from "next/server";
import { BACKEND, bearerHeaders } from "@/lib/backend";

function getToken(request: NextRequest) {
  return request.cookies.get("access_token")?.value;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const upstream = await fetch(`${BACKEND}/me/modules/${params.id}`, {
    method: "PUT",
    headers: bearerHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  const upstream = await fetch(`${BACKEND}/me/modules/${params.id}`, {
    method: "DELETE",
    headers: bearerHeaders(token),
  });
  if (upstream.status === 204) return new NextResponse(null, { status: 204 });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
