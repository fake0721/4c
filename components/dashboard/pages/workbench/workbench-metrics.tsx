import type { WorkbenchMetricSet } from "@/lib/dashboard/workbench";

type WorkbenchMetricsProps = {
  metrics: WorkbenchMetricSet;
};

export function WorkbenchMetrics({ metrics }: WorkbenchMetricsProps) {
  const cards = [
    {
      key: "totalLogs",
      label: "日志总数",
      icon: "data_exploration",
      iconClass: "bg-[#E8F3FF] text-[#165DFF]",
      hint: "已同步日志总量",
      hintIcon: "trending_up",
      valueClass: "text-[#1D2129]",
      panelClass: "glass-panel obsidian-glow group hover:bg-white/10",
    },
    {
      key: "totalIssues",
      label: "问题总数",
      icon: "rule",
      iconClass: "bg-[#EEF4FF] text-[#3B82F6]",
      hint: "已同步问题总量",
      hintIcon: "trending_down",
      valueClass: "text-[#1D2129]",
      panelClass: "group border border-[#D8E7FF] bg-[#F8FBFF] hover:bg-[#F2F8FF] shadow-[0_8px_20px_-10px_rgba(59,130,246,0.26)]",
    },
    {
      key: "highRisk",
      label: "高风险问题",
      icon: "warning",
      iconClass: "bg-[#FFF1E8] text-[#FF7D00]",
      hint: "已同步高风险统计",
      hintIcon: "warning",
      valueClass: "text-[#CC5F00]",
      panelClass: "group border border-[#FFD1A8] bg-[#FFF6EE] hover:bg-[#FFF1E4] shadow-[0_8px_24px_-8px_rgba(255,125,0,0.28)]",
    },
    {
      key: "pendingReviews",
      label: "待复核问题",
      icon: "pending_actions",
      iconClass: "bg-[#F3EEFF] text-[#7A45FF]",
      hint: metrics.pendingReviews > 0 ? `待人工复核 ${metrics.pendingReviews} 项` : "当前无待复核问题",
      hintIcon: "pending_actions",
      valueClass: "text-[#1D2129]",
      panelClass: "group border border-[#E4DBFF] bg-[#FAF8FF] hover:bg-[#F5F1FF] shadow-[0_8px_20px_-10px_rgba(122,69,255,0.24)]",
    },
  ] as const;

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const value = metrics[card.key];
        return (
          <div
            key={card.key}
            className={`${card.panelClass} cursor-default rounded-2xl p-6 transition-all`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className={`rounded-lg p-2 ${card.iconClass}`}>
                <span className="material-symbols-outlined" style={card.key === "highRisk" ? { fontVariationSettings: '"FILL" 1' } : undefined}>
                  {card.icon}
                </span>
              </div>
              <span className={`font-label text-xs uppercase tracking-widest ${card.key === "highRisk" ? "text-[#CC5F00]/80" : card.key === "totalIssues" ? "text-[#3B82F6]/90" : card.key === "pendingReviews" ? "text-[#7A45FF]/90" : "text-[#4E5969]"}`}>
                {card.label}
              </span>
            </div>
            <h3 className={`mb-1 font-headline text-3xl font-extrabold ${card.valueClass}`}>
              {value.toLocaleString("zh-CN")}
            </h3>
            <p className={`flex items-center text-xs font-medium ${card.key === "highRisk" ? "text-[#FF7D00]" : card.key === "pendingReviews" ? "text-[#7A45FF]" : card.key === "totalIssues" ? "text-[#3B82F6]" : "text-[#165DFF]"}`}>
              <span className="material-symbols-outlined mr-1 text-xs">{card.hintIcon}</span>
              {card.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}
