import { NextResponse } from "next/server";
import { BACKEND } from "@/lib/backend";

export async function GET() {
  const upstream = await fetch(`${BACKEND}/universities`);
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
