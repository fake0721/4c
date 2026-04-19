import { HistoryCasesPage } from "@/components/dashboard/pages/history-cases/history-cases-page";
import { getHistoryCasesPageData } from "@/lib/dashboard/history-cases";

export default async function DashboardHistoryCasesPage() {
  const data = await getHistoryCasesPageData();
  return <HistoryCasesPage data={data} />;
}
