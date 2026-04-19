import { getWorkbenchData } from "@/lib/dashboard/workbench";
import { WorkbenchPage } from "@/components/dashboard/pages/workbench/workbench-page";

export default async function DashboardPage() {
  const data = await getWorkbenchData();

  return <WorkbenchPage data={data} />;
}
