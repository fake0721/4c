import { UploadPage } from "@/components/dashboard/pages/upload/upload-page";
import { DashboardLayout } from "@/components/dashboard/shell/dashboard-layout";
import { getDashboardShellData } from "@/lib/dashboard/workbench";
import { getLlmReadiness } from "@/lib/llm/availability";
import { getSelectableDetectionRules } from "@/lib/rules/db-rules";

export default async function UploadRoutePage() {
  const shellData = await getDashboardShellData();
  const selectableRules = await getSelectableDetectionRules();
  const llmReadiness = getLlmReadiness();

  return (
    <DashboardLayout {...shellData}>
      <UploadPage
        selectableRules={selectableRules}
        llmReady={llmReadiness.ready}
        llmProvider={llmReadiness.provider}
        llmStatusMessage={llmReadiness.message}
      />
    </DashboardLayout>
  );
}
