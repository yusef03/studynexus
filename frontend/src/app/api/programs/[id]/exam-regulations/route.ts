import { NextRequest, NextResponse } from "next/server";
import { BACKEND } from "@/lib/backend";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const upstream = await fetch(`${BACKEND}/programs/${params.id}/exam-regulations`);
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
