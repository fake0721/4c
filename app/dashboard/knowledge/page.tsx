import { KnowledgePage } from "@/components/dashboard/pages/knowledge/knowledge-page";
import { getKnowledgePageData } from "@/lib/dashboard/knowledge";

export default async function DashboardKnowledgePage() {
  const data = await getKnowledgePageData();
  return <KnowledgePage data={data} />;
}
