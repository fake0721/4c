type ModeComparisonItem = {
  mode: string;
  detections: number;
  latency: string;
  calls: number;
  highlight?: boolean;
};

type ModeComparisonProps = {
  items: ModeComparisonItem[];
};

export function ModeComparison({ items }: ModeComparisonProps) {
  const maxDetections = Math.max(...items.map((item) => item.detections));

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.mode}
          className={`rounded-3xl border px-4 py-4 ${
            item.highlight
              ? "border-[#9eb4cd] bg-[#f2f7fd] shadow-[0_8px_22px_rgba(31,78,121,0.12)]"
              : "border-[#dce4ee] bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[#1f2a37]">{item.mode}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-[#7b8898]">
              {item.latency}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e7edf5]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,_#1f4e79,_#5b8fb9)]"
              style={{ width: `${(item.detections / maxDetections) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-[#5f6b7a]">
            <span>异常数 {item.detections}</span>
            <span>模型调用 {item.calls}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
