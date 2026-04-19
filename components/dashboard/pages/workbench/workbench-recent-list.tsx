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
        <Link href="/dashboard/high-risk" className="font-label text-xs uppercase tracking-widest text-[#1F4E79] hover:underline">
          查看全部
        </Link>
      </div>
      <div className="flex-grow">
        <table className="w-full">
          <tbody className="divide-y divide-[#DCE4EE]">
            {recentLogs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-8 py-8 text-sm text-[#5F6B7A]">
                  暂无分析记录，新的日志分析结果会显示在这里。
                </td>
              </tr>
            ) : (
              recentLogs.slice(0, 4).map((item) => {
                const isCompleted = item.statusLabel === "已完成";
                const statusClass = isCompleted
                  ? "bg-green-500/10 text-green-600"
                  : item.statusLabel === "分析中"
                    ? "bg-cyan-500/10 text-cyan-600"
                    : "bg-orange-500/10 text-orange-500";
                const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleString("zh-CN") : "-";
                const href = isCompleted ? `/dashboard/analyses?logId=${encodeURIComponent(item.id)}` : "/dashboard/high-risk";

                return (
                  <tr key={item.id} className="group transition-colors hover:bg-[#FBF4E8]">
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
                        <span className="material-symbols-outlined text-[#7B8898] transition-colors group-hover:text-[#1F4E79]">arrow_forward</span>
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
