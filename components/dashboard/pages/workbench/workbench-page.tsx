import type { WorkbenchData } from "@/lib/dashboard/workbench";
import { WorkbenchMetrics } from "@/components/dashboard/pages/workbench/workbench-metrics";
import { WorkbenchTrend } from "@/components/dashboard/pages/workbench/workbench-trend";
import { WorkbenchTypeBreakdown } from "@/components/dashboard/pages/workbench/workbench-type-breakdown";
import { WorkbenchRecentList } from "@/components/dashboard/pages/workbench/workbench-recent-list";
import { WorkbenchPendingTodos } from "@/components/dashboard/pages/workbench/workbench-pending-todos";

type WorkbenchPageProps = {
  data: WorkbenchData;
};

export function WorkbenchPage({ data }: WorkbenchPageProps) {
  return (
    <div className="mx-auto w-full max-w-[1720px] text-[#1F2A37]">
      <WorkbenchMetrics metrics={data.metrics} />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <WorkbenchTrend trend={data.trend} />
        <WorkbenchTypeBreakdown typeBreakdown={data.typeBreakdown} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WorkbenchRecentList recentLogs={data.recentLogs} />
        <WorkbenchPendingTodos pendingTodos={data.pendingTodos} pendingReviewCount={data.pendingReviewCount} />
      </div>
    </div>
  );
}
