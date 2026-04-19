import { SettingsPage } from "@/components/dashboard/pages/settings/settings-page";
import { getSettingsPageData } from "@/lib/dashboard/settings";

export default async function DashboardSettingsPage() {
  const data = await getSettingsPageData();
  return <SettingsPage data={data} />;
}
