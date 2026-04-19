import { RulesPage } from "@/components/dashboard/pages/rules/rules-page";
import { getRulesPageData } from "@/lib/dashboard/rules";

export default async function DashboardRulesPage() {
  const data = await getRulesPageData();
  return <RulesPage data={data} />;
}
