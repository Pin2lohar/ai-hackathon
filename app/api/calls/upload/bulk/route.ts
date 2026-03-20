import { NextResponse } from "next/server";
import { processCallUpload } from "@/lib/process-call-upload";
import type { BulkUploadResultItem } from "@/types/bulk-upload";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Cap per request to stay within typical route timeouts and request body limits. */
const MAX_FILES = 10;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const raw = formData.getAll("files");
    const files = raw.filter((v): v is File => v instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Add at least one file (field name \"files\")." },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        {
          error: `Too many files at once (max ${MAX_FILES}). Split into multiple batches.`,
        },
        { status: 400 },
      );
    }

    const results: BulkUploadResultItem[] = [];

    for (const file of files) {
      const outcome = await processCallUpload(file);
      const filename = file.name || "unnamed";

      if (outcome.ok) {
        results.push({
          filename,
          success: true,
          callId: outcome.call._id,
        });
      } else {
        results.push({
          filename,
          success: false,
          error: outcome.error,
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.length - succeeded;

    return NextResponse.json({
      results,
      summary: { total: results.length, succeeded, failed },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Bulk upload failed";
    console.error("[bulk upload]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
