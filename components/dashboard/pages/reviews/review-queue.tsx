import type { ReviewItem } from "@/lib/dashboard/reviews";

type ReviewQueueProps = {
  queue: ReviewItem[];
  activeId: string | null;
  activeIndex: number;
  exitingId: string | null;
  onSelect: (id: string) => void;
};

function toRiskChip(item: ReviewItem) {
  if (item.riskLabel.includes("高")) {
    return {
      text: "HIGH RISK",
      className: "bg-[#F9E9E9] text-[#B45151] border border-[#E9C3C3]",
    };
  }

  if (item.riskLabel.includes("低")) {
    return {
      text: "LOW RISK",
      className: "bg-[#EAF3FC] text-[#2F6A9A] border border-[#C4D2E3]",
    };
  }

  return {
    text: "PENDING",
    className: "bg-[#F2F5F9] text-[#5F6B7A] border border-[#D6DEE8]",
  };
}

function toSourceIcon(title: string) {
  const key = title.toLowerCase();
  if (key.includes("数据库") || key.includes("sql") || key.includes("db")) return "database";
  if (key.includes("api") || key.includes("http") || key.includes("网络")) return "lan";
  if (key.includes("内存") || key.includes("memory")) return "memory";
  return "description";
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function ReviewQueue({ queue, activeId, activeIndex, exitingId, onSelect }: ReviewQueueProps) {
  return (
    <div className="flex w-full flex-col overflow-y-auto border-r border-[#DCE4EE] bg-[#F3F5F8] lg:w-[34%]">
      <div className="sticky top-0 z-10 flex items-end justify-between border-b border-[#DCE4EE] bg-[#F3F5F8]/95 p-6 backdrop-blur-sm">
        <div>
          <h2 className="font-headline text-lg font-bold tracking-tight text-[#1F2A37]">待复核列表</h2>
          <p className="mt-1 font-label text-xs text-[#5F6B7A]">
            {queue.length > 0 ? `当前连续处理 ${activeIndex + 1} / ${queue.length}` : "当前处理 0 / 0"}
          </p>
        </div>
        <button className="material-symbols-outlined text-[#7B8898] transition-colors hover:text-[#1F2A37]" type="button">
          filter_list
        </button>
      </div>
      <div className="space-y-3 px-4 pb-12">
        {queue.length === 0 ? (
          <div className="rounded-2xl border border-[#DCE4EE] bg-[#F8FAFD] p-5 text-sm text-[#5F6B7A]">
            当前没有待复核任务
          </div>
        ) : (
          queue.map((item) => {
            const active = item.id === activeId;
            const exiting = item.id === exitingId;
            const riskChip = toRiskChip(item);
            const updatedAt = new Date(item.updatedAt).toLocaleTimeString("zh-CN", { hour12: false });

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!exiting) {
                    onSelect(item.id);
                  }
                }}
                className={`group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                  exiting
                    ? "pointer-events-none scale-[0.98] opacity-0 -translate-y-1"
                    : ""
                } ${
                  active
                    ? "border-[#2F5F8E]/35 bg-[#FFFFFF] shadow-[0_0_15px_rgba(31,78,121,0.15)]"
                    : "border-[#DCE4EE] bg-[#F8FAFD] shadow-[0_4px_12px_rgba(31,42,55,0.05)] hover:bg-[#EEF3F9]"
                }`}
              >
                {active ? <div className="absolute left-0 top-0 h-full w-1 bg-[#2F5F8E]"></div> : null}
                <div className="mb-3 flex items-start justify-between">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${riskChip.className}`}>{riskChip.text}</span>
                  <span className="font-label text-[10px] uppercase tracking-tighter text-[#7B8898]">{updatedAt}</span>
                </div>
                <h3 className="mb-2 text-sm font-bold text-[#1F2A37] transition-colors group-hover:text-[#1F4E79]">{item.title}</h3>
                <div className="mb-4 flex items-center gap-2 text-xs text-[#5F6B7A]">
                  <span className="material-symbols-outlined text-xs">{toSourceIcon(item.title)}</span>
                  <span>{item.sourceLog}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#5F6B7A]">AI 置信度: {formatConfidence(item.confidence)}</span>
                  <span className={active ? "flex items-center gap-1 font-bold text-[#1F4E79]" : "text-[#7B8898]"}>
                    {active ? "处理中" : "等待复核"}
                    {active ? <span className="h-1 w-1 rounded-full bg-[#1F4E79]"></span> : null}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
