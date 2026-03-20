import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/calls";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
