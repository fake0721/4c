"use client";

type AnalysesFiltersProps = {
  statusFilter: string;
  riskFilter: string;
  keyword: string;
  onStatusChange: (value: string) => void;
  onRiskChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
};

export function AnalysesFilters({
  statusFilter,
  riskFilter,
  keyword,
  onStatusChange,
  onRiskChange,
  onKeywordChange,
}: AnalysesFiltersProps) {
  return (
    <section className="glass-panel mb-8 rounded-[26px] border border-[#DCE4EE] p-6 shadow-[0_12px_30px_rgba(31,59,53,0.06)]">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="space-y-2">
          <label className="block px-1 font-label text-[10px] uppercase tracking-[0.28em] text-[#7A6E63]">时间范围</label>
          <div className="relative">
            <input
              className="w-full rounded-xl border border-[#DCE4EE] bg-[#F4FFFB] px-4 py-3 text-sm text-[#1F2A37] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] placeholder:text-[#9A8F84] outline-none transition-all focus:border-[#C4A57E] focus:ring-2 focus:ring-[#1F4E79]/10"
              placeholder="选择日期范围"
              type="text"
              readOnly
            />
            <span className="material-symbols-outlined absolute right-3 top-3 text-sm text-[#9A8F84]">calendar_today</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block px-1 font-label text-[10px] uppercase tracking-[0.28em] text-[#7A6E63]">分析状态</label>
          <div className="relative">
          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            className="w-full appearance-none rounded-xl border border-[#DCE4EE] bg-[#F4FFFB] px-4 py-3 pr-10 text-sm text-[#1F2A37] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition-all focus:border-[#C4A57E] focus:ring-2 focus:ring-[#1F4E79]/10"
          >
            <option>全部状态</option>
            <option>已完成</option>
            <option>分析中</option>
            <option>已失败</option>
          </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-sm text-[#9A8F84]">expand_more</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block px-1 font-label text-[10px] uppercase tracking-[0.28em] text-[#7A6E63]">风险等级</label>
          <div className="relative">
          <select
            value={riskFilter}
            onChange={(event) => onRiskChange(event.target.value)}
            className="w-full appearance-none rounded-xl border border-[#DCE4EE] bg-[#F4FFFB] px-4 py-3 pr-10 text-sm text-[#1F2A37] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition-all focus:border-[#C4A57E] focus:ring-2 focus:ring-[#1F4E79]/10"
          >
            <option>全部风险</option>
            <option>高风险</option>
            <option>中风险</option>
            <option>低风险</option>
          </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-sm text-[#9A8F84]">expand_more</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block px-1 font-label text-[10px] uppercase tracking-[0.28em] text-[#7A6E63]">文件名搜索</label>
          <div className="relative">
            <input
              className="w-full rounded-xl border border-[#DCE4EE] bg-[#F4FFFB] px-4 py-3 text-sm text-[#1F2A37] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] placeholder:text-[#9A8F84] outline-none transition-all focus:border-[#C4A57E] focus:ring-2 focus:ring-[#1F4E79]/10"
              placeholder="输入日志文件名..."
              type="text"
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
            />
            <span className="material-symbols-outlined absolute right-3 top-3 text-sm text-[#9A8F84]">search</span>
          </div>
        </div>
      </div>
    </section>
  );
}
