import { NextResponse } from "next/server";
import { deleteCallById, getCallById } from "@/lib/calls";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const call = await getCallById(id);
    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }
    return NextResponse.json({ call });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load call";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteCallById(id);
    if (!result.ok) {
      const status = result.reason === "invalid_id" ? 400 : 404;
      return NextResponse.json({ error: result.reason }, { status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete call";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
