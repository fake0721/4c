import { AnalysisReportPage } from "@/components/dashboard/pages/analysis-report/analysis-report-page";
import { getAnalysisReportData } from "@/lib/dashboard/analysis-report";

type DashboardAnalysesPageProps = {
  searchParams?: Promise<{
    logId?: string;
  }>;
};

export default async function DashboardAnalysesPage({ searchParams }: DashboardAnalysesPageProps) {
  const params = (await searchParams) ?? {};
  const logId = typeof params.logId === "string" ? params.logId.trim() : "";
  const data = await getAnalysisReportData(logId);

  return <AnalysisReportPage data={data} />;
}
