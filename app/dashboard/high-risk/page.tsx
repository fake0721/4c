import { AnalysesPage } from "@/components/dashboard/pages/analyses/analyses-page";
import { getAnalysesPageData } from "@/lib/dashboard/analyses";

export default async function DashboardHighRiskPage() {
  const data = await getAnalysesPageData();

  return <AnalysesPage data={data} />;
}
