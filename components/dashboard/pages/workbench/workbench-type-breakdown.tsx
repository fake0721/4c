import type { WorkbenchTypeBreakdownItem } from "@/lib/dashboard/workbench";

type WorkbenchTypeBreakdownProps = {
  typeBreakdown: WorkbenchTypeBreakdownItem[];
};

const BAR_COLORS = ["#7B5EA7", "#2F7A8C", "#4C8C4A", "#C2873C", "#C94F4F"];

export function WorkbenchTypeBreakdown({ typeBreakdown }: WorkbenchTypeBreakdownProps) {
  const rows = typeBreakdown.length > 0 ? typeBreakdown : Array.from({ length: 5 }).map(() => ({ label: "加载中", count: 0, percent: 0 }));

  return (
    <div className="glass-panel flex h-[400px] flex-col rounded-2xl p-8">
      <h4 className="mb-8 font-headline text-lg font-bold">问题类型分布横向条形图</h4>
      <div className="space-y-6">
        {rows.slice(0, 5).map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <div className="font-label mb-2 flex justify-between text-xs uppercase text-[#5F6B7A]">
              <span>{item.label}</span>
              <span>{item.percent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E6D9C7]">
              <div className="h-full" style={{ width: `${Math.max(0, Math.min(100, item.percent))}%`, backgroundColor: BAR_COLORS[index] }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
