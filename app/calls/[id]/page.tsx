import { notFound } from "next/navigation";
import { getCallById } from "@/lib/calls";
import { CallDetailView } from "@/components/calls/call-detail-view";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const call = await getCallById(id);
  if (!call) {
    return { title: "Call not found" };
  }
  return {
    title: `${call.originalFilename} | Call Intelligence`,
  };
}

export default async function CallDetailPage({ params }: PageProps) {
  const { id } = await params;
  const call = await getCallById(id);
  if (!call) {
    notFound();
  }
  return <CallDetailView call={call} />;
}
