import { IncidentsPage } from "@/components/dashboard/pages/incidents/incidents-page";
import { getIncidentsPageData } from "@/lib/dashboard/incidents";

export default async function DashboardIncidentsPage() {
  const data = await getIncidentsPageData();

  return <IncidentsPage data={data} />;
}
