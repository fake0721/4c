import Link from "next/link";
import type { WorkbenchRecentLog } from "@/lib/dashboard/workbench";

type WorkbenchRecentListProps = {
  recentLogs: WorkbenchRecentLog[];
};

export function WorkbenchRecentList({ recentLogs }: WorkbenchRecentListProps) {
  return (
    <div className="glass-panel flex flex-col overflow-hidden rounded-2xl border border-[#CBD7E4] shadow-[0_6px_18px_rgba(31,59,53,0.08)]">
      <div className="flex items-center justify-between border-b border-[#CBD7E4] px-8 py-6">
        <h4 className="font-headline text-lg font-bold">最近分析结果</h4>
        <Link href="/dashboard/high-risk" className="font-label text-xs uppercase tracking-widest text-[#165DFF] hover:underline">
          查看全部
        </Link>
      </div>
      <div className="flex-grow">
        <table className="w-full">
          <tbody className="divide-y divide-[#DCE4EE]">
            {recentLogs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-8 py-8 text-sm text-[#5F6B7A] bg-[#F8FBFF]">
                  暂无分析记录，新的日志分析结果会显示在这里。
                </td>
              </tr>
            ) : (
              recentLogs.slice(0, 4).map((item) => {
                const isCompleted = item.statusLabel === "已完成";
                const statusClass = isCompleted
                  ? "bg-[#E9F8EF] text-[#15803D]"
                  : item.statusLabel === "分析中"
                    ? "bg-[#EAF3FF] text-[#165DFF]"
                    : "bg-[#FFF2E8] text-[#FF7D00]";
                const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleString("zh-CN") : "-";
                const href = isCompleted ? `/dashboard/analyses?logId=${encodeURIComponent(item.id)}` : "/dashboard/high-risk";

                return (
                  <tr key={item.id} className="group transition-colors hover:bg-[#EEF4FF]">
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#1F2A37]">{item.fileName || "未命名日志"}</span>
                        <span className="font-label text-[10px] text-[#7B8898]">{createdAt}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusClass}`}>
                        {item.statusLabel}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <Link href={href} className="opacity-80 transition-opacity hover:opacity-100">
                        <span className="material-symbols-outlined text-[#7B8898] transition-colors group-hover:text-[#165DFF]">arrow_forward</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
