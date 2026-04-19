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
      iconClass: "bg-[#1F4E79]/10 text-[#1F4E79]",
      hint: "已同步日志总量",
      hintIcon: "trending_up",
      valueClass: "text-[#1F2A37]",
      panelClass: "glass-panel obsidian-glow group hover:bg-white/10",
    },
    {
      key: "totalIssues",
      label: "问题总数",
      icon: "rule",
      iconClass: "bg-[#3A6A9A]/10 text-[#3A6A9A]",
      hint: "已同步问题总量",
      hintIcon: "trending_down",
      valueClass: "text-[#1F2A37]",
      panelClass: "glass-panel group hover:bg-white/10",
    },
    {
      key: "highRisk",
      label: "高风险问题",
      icon: "warning",
      iconClass: "bg-[#E9BE98] text-[#8A4D24]",
      hint: "已同步高风险统计",
      hintIcon: "warning",
      valueClass: "text-[#7A3518]",
      panelClass: "group border border-[#D8B08C] bg-[#FCEBDD] hover:bg-[#F8E1CF] shadow-[0_8px_24px_-8px_rgba(181,119,67,0.35)]",
    },
    {
      key: "pendingReviews",
      label: "待复核问题",
      icon: "pending_actions",
      iconClass: "bg-yellow-400/10 text-yellow-500",
      hint: metrics.pendingReviews > 0 ? `待人工复核 ${metrics.pendingReviews} 项` : "当前无待复核问题",
      hintIcon: "pending_actions",
      valueClass: "text-[#1F2A37]",
      panelClass: "glass-panel group hover:bg-white/10",
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
              <span className={`font-label text-xs uppercase tracking-widest ${card.key === "highRisk" ? "text-[#8A4D24]/80" : "text-[#5F6B7A]"}`}>
                {card.label}
              </span>
            </div>
            <h3 className={`mb-1 font-headline text-3xl font-extrabold ${card.valueClass}`}>
              {value.toLocaleString("zh-CN")}
            </h3>
            <p className={`flex items-center text-xs font-medium ${card.key === "highRisk" ? "text-[#8A4D24]" : card.key === "pendingReviews" ? "text-yellow-600" : card.key === "totalIssues" ? "text-[#3A6A9A]" : "text-[#1F4E79]"}`}>
              <span className="material-symbols-outlined mr-1 text-xs">{card.hintIcon}</span>
              {card.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}
