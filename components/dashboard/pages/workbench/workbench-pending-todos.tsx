import Link from "next/link";
import type { WorkbenchTodo } from "@/lib/dashboard/workbench";

type WorkbenchPendingTodosProps = {
  pendingTodos: WorkbenchTodo[];
  pendingReviewCount: number;
};

export function WorkbenchPendingTodos({ pendingTodos, pendingReviewCount }: WorkbenchPendingTodosProps) {
  return (
    <div className="glass-panel flex flex-col rounded-2xl border border-[#CBD7E4] shadow-[0_6px_18px_rgba(31,59,53,0.08)]">
      <div className="flex items-center justify-between border-b border-[#CBD7E4] px-8 py-6">
        <h4 className="font-headline text-lg font-bold">待处理事项</h4>
        <span className="rounded-full border border-[#69B1FF]/45 bg-[#E8F3FF] px-2.5 py-0.5 text-[10px] font-bold text-[#165DFF]">
          {pendingReviewCount} 条待办
        </span>
      </div>
      <div className="space-y-4 p-6">
        {pendingTodos.length === 0 ? (
          <div className="rounded-xl border-l-4 border-[#36B37E] bg-[#F1FFF8] p-4 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <h5 className="mb-1 text-sm font-bold text-[#1F2A37]">暂无待处理事项</h5>
                <p className="text-xs text-[#5F6B7A]">当前无需人工复核，系统将持续监控新问题。</p>
              </div>
              <span className="material-symbols-outlined text-[#36B37E] opacity-80">task_alt</span>
            </div>
          </div>
        ) : (
          pendingTodos.slice(0, 3).map((item, index) => {
            const borderClass = index === 0 ? "border-[#FF7D00]" : index === 1 ? "border-[#165DFF]" : "border-[#7A45FF]";
            const surfaceClass = index === 0 ? "bg-[#FFF4EA] hover:bg-[#FFEAD8]" : index === 1 ? "bg-[#EFF5FF] hover:bg-[#E5EFFF]" : "bg-[#F5F1FF] hover:bg-[#EEE7FF]";
            const iconClass = index === 0 ? "text-[#FF7D00]" : index === 1 ? "text-[#165DFF]" : "text-[#7A45FF]";
            const icon = index === 0 ? "priority_high" : index === 1 ? "visibility" : "description";
            return (
              <Link
                key={item.id}
                href="/dashboard/reviews"
                className={`group block rounded-xl border-l-4 p-4 transition-colors ${borderClass} ${surfaceClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-grow">
                    <h5 className="mb-1 text-sm font-bold text-[#1F2A37]">{item.title}</h5>
                    <p className="text-xs text-[#5F6B7A]">{item.description}</p>
                  </div>
                  <span className={`material-symbols-outlined opacity-70 transition-opacity group-hover:opacity-100 ${iconClass}`}>{icon}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
