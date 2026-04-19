import { PerformancePage } from "@/components/dashboard/pages/performance/performance-page";
import { getPerformancePageData } from "@/lib/dashboard/performance";

type DashboardPerformancePageProps = {
  searchParams?: Promise<{
    days?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

export default async function DashboardPerformancePage({ searchParams }: DashboardPerformancePageProps) {
  const params = (await searchParams) ?? {};
  const days = Number(params.days ?? "7");
  const startDate = typeof params.startDate === "string" ? params.startDate.trim() : "";
  const endDate = typeof params.endDate === "string" ? params.endDate.trim() : "";
  const data = await getPerformancePageData({ days, startDate, endDate });

  return <PerformancePage initialData={data} />;
}
