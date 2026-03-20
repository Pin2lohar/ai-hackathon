import { NextResponse } from "next/server";
import { listCalls } from "@/lib/calls";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "100");
    const calls = await listCalls(Number.isFinite(limit) ? limit : 100);
    return NextResponse.json({ calls });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list calls";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
