"use client";

import { useMemo, useState } from "react";
import type { WorkbenchTrendPoint } from "@/lib/dashboard/workbench";

type WorkbenchTrendProps = {
  trend: WorkbenchTrendPoint[];
};

function buildPath(values: number[], closeArea: boolean, scaleMaxValue: number) {
  const width = 800;
  const minY = 30;
  const maxY = 180;
  const maxValue = Math.max(scaleMaxValue, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  const line = values
    .map((value, index) => {
      const x = Math.round(stepX * index);
      const y = Math.round(maxY - (value / maxValue) * (maxY - minY));
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return closeArea ? `${line} L800,200 L0,200 Z` : line;
}

export function WorkbenchTrend({ trend }: WorkbenchTrendProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const safeTrend = trend.length > 0 ? trend : Array.from({ length: 7 }).map((_, index) => ({ day: `${index + 1}`, total: 0, high: 0 }));
  const totalValues = safeTrend.map((item) => item.total);
  const highValues = safeTrend.map((item) => item.high);
  const sharedMaxValue = Math.max(...totalValues, ...highValues, 1);

  const chartPaths = useMemo(
    () => ({
      totalArea: buildPath(totalValues, true, sharedMaxValue),
      totalLine: buildPath(totalValues, false, sharedMaxValue),
      highArea: buildPath(highValues, true, sharedMaxValue),
      highLine: buildPath(highValues, false, sharedMaxValue),
    }),
    [highValues, sharedMaxValue, totalValues],
  );

  const guideLeft = hoveredIndex === null ? 0 : `${(hoveredIndex / Math.max(1, safeTrend.length - 1)) * 100}%`;
  const tooltipLeft = hoveredIndex === null ? "0%" : `${Math.min(82, Math.max(2, (hoveredIndex / Math.max(1, safeTrend.length - 1)) * 100 + 1.5))}%`;
  const hoveredPoint = hoveredIndex === null ? null : safeTrend[hoveredIndex];

  return (
    <div className="glass-panel lg:col-span-2 flex h-[400px] flex-col rounded-2xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h4 className="font-headline text-lg font-bold">近 7 天问题趋势折线图</h4>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-[#1F4E79]"></span>
            <span className="font-label text-xs uppercase text-[#5F6B7A]">总计</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-[#E53935]"></span>
            <span className="font-label text-xs uppercase text-[#5F6B7A]">高风险</span>
          </div>
        </div>
      </div>
      <div className="relative mt-auto flex flex-grow items-end space-x-4">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-60">
          <svg className="h-full w-full drop-shadow-[0_0_6px_rgba(31,78,121,0.18)]" viewBox="0 0 800 200">
            <defs>
              <linearGradient id="totalAreaGradientReact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1F4E79" stopOpacity="0.18"></stop>
                <stop offset="100%" stopColor="#1F4E79" stopOpacity="0"></stop>
              </linearGradient>
            </defs>
            <path d={chartPaths.totalArea} fill="url(#totalAreaGradientReact)"></path>
            <path d={chartPaths.totalLine} fill="none" stroke="#1F4E79" strokeWidth="3"></path>
          </svg>
          <svg className="absolute inset-0 h-full w-full drop-shadow-[0_0_5px_rgba(229,57,53,0.2)]" viewBox="0 0 800 200">
            <defs>
              <linearGradient id="riskAreaGradientReact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E53935" stopOpacity="0.16"></stop>
                <stop offset="100%" stopColor="#E53935" stopOpacity="0"></stop>
              </linearGradient>
            </defs>
            <path d={chartPaths.highArea} fill="url(#riskAreaGradientReact)"></path>
            <path d={chartPaths.highLine} fill="none" stroke="#E53935" strokeWidth="2.5"></path>
          </svg>
        </div>
        <div className="absolute inset-0 z-10 grid grid-cols-7">
          {safeTrend.map((item, index) => (
            <button
              key={`${item.day}-${index}`}
              type="button"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              className="h-full w-full"
              aria-label={`${item.day} 总计 ${item.total} 高风险 ${item.high}`}
            />
          ))}
        </div>
        {hoveredPoint ? (
          <>
            <div className="pointer-events-none absolute bottom-6 top-0 z-20 w-px bg-[#BCA890]/60" style={{ left: guideLeft }}></div>
            <div className="pointer-events-none absolute top-2 z-30 rounded-lg border border-[#CBD7E4] bg-[#FFFFFF]/95 px-3 py-2 text-xs shadow-[0_8px_20px_rgba(31,59,53,0.12)]" style={{ left: tooltipLeft }}>
              <p className="font-bold">{hoveredPoint.day}</p>
              <p>总计: {hoveredPoint.total}</p>
              <p>高风险: {hoveredPoint.high}</p>
            </div>
          </>
        ) : null}
        <div className="mt-auto flex w-full justify-between border-t border-[#DCE4EE] px-2 pt-4">
          {safeTrend.map((item) => (
            <span key={item.day} className="font-label text-[10px] text-[#7B8898]">
              {item.day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
