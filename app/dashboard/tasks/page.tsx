import { TasksPage } from "@/components/dashboard/pages/tasks/tasks-page";
import { getTasksPageData } from "@/lib/dashboard/tasks";

export default async function DashboardTasksPage() {
  const data = await getTasksPageData();

  return <TasksPage data={data} />;
}
