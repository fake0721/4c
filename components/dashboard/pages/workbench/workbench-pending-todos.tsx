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
        <span className="rounded bg-[#1F4E79]/20 px-2 py-0.5 text-[10px] font-bold text-[#1F4E79]">
          {pendingReviewCount} 条待办
        </span>
      </div>
      <div className="space-y-4 p-6">
        {pendingTodos.length === 0 ? (
          <div className="rounded-xl border-l-4 border-emerald-500 bg-[#F4FFFB] p-4 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <h5 className="mb-1 text-sm font-bold text-[#1F2A37]">暂无待处理事项</h5>
                <p className="text-xs text-[#5F6B7A]">当前无需人工复核，系统将持续监控新问题。</p>
              </div>
              <span className="material-symbols-outlined text-[#5F6B7A] opacity-70">task_alt</span>
            </div>
          </div>
        ) : (
          pendingTodos.slice(0, 3).map((item, index) => {
            const borderClass = index === 0 ? "border-orange-500" : index === 1 ? "border-yellow-400" : "border-emerald-500";
            const iconClass = index === 0 ? "text-orange-500" : index === 1 ? "text-yellow-500" : "text-white/40";
            const icon = index === 0 ? "priority_high" : index === 1 ? "visibility" : "description";
            return (
              <Link
                key={item.id}
                href="/dashboard/reviews"
                className={`group block rounded-xl border-l-4 bg-[#F4FFFB] p-4 transition-colors hover:bg-[#F4E8D6] ${borderClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-grow">
                    <h5 className="mb-1 text-sm font-bold text-[#1F2A37]">{item.title}</h5>
                    <p className="text-xs text-[#5F6B7A]">{item.description}</p>
                  </div>
                  <span className={`material-symbols-outlined opacity-60 transition-opacity group-hover:opacity-100 ${iconClass}`}>{icon}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
