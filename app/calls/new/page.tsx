import { BulkUploadCallForm } from "@/components/calls/bulk-upload-call-form";
import { UploadCallForm } from "@/components/calls/upload-call-form";

export const metadata = {
  title: "Upload call | Call Intelligence",
};

export default function NewCallPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          New call
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Files are transcribed with OpenAI Whisper, then scored with GPT using a
          structured QA rubric.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-start">
        <UploadCallForm />
        <BulkUploadCallForm />
      </div>
    </div>
  );
}
