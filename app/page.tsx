import { getDashboardStats, listCalls } from "@/lib/calls";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, recentCalls] = await Promise.all([
    getDashboardStats(),
    listCalls(8),
  ]);

  return <DashboardView stats={stats} recentCalls={recentCalls} />;
}
