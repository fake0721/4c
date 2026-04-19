type RingChartSegment = {
  label: string;
  value: number;
  color: string;
};

type RingChartProps = {
  segments: RingChartSegment[];
};

export function RingChart({ segments }: RingChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const gradientStops = segments
    .reduce(
      (accumulator, segment) => {
        const start = total === 0 ? 0 : (accumulator.offset / total) * 100;
        const nextOffset = accumulator.offset + segment.value;
        const end = total === 0 ? 0 : (nextOffset / total) * 100;

        return {
          offset: nextOffset,
          stops: [...accumulator.stops, `${segment.color} ${start}% ${end}%`],
        };
      },
      { offset: 0, stops: [] as string[] },
    )
    .stops.join(", ");

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative h-40 w-40 rounded-full"
        style={{
          background: `conic-gradient(${gradientStops})`,
        }}
      >
        <div className="absolute inset-5 flex items-center justify-center rounded-full bg-[#0d1727] text-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Risk Mix
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">{total}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
