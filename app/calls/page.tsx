import { listAllCalls } from "@/lib/calls";
import { CallsIndexView } from "@/components/calls/calls-index-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "All calls",
};

export default async function CallsIndexPage() {
  const calls = await listAllCalls();
  return <CallsIndexView calls={calls} />;
}
