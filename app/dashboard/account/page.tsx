import { AccountPage } from "@/components/dashboard/pages/account/account-page";
import { getAccountPageData } from "@/lib/dashboard/account";

export default async function DashboardAccountPage() {
  const data = await getAccountPageData();

  return <AccountPage data={data} />;
}
