"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionCard } from "@/components/dashboard/section-card";

type OverviewChartsProps = {
  typeBreakdown: {
    label: string;
    value: number;
  }[];
  riskBreakdown: {
    label: string;
    value: number;
    color: string;
  }[];
  modeComparison: {
    mode: string;
    tasks: number;
    findings: number;
    avgConfidence: number;
  }[];
};

const riskLabelMap: Record<string, string> = {
  High: "高风险",
  Medium: "中风险",
  Low: "低风险",
  Uncertain: "待确认",
};

export function OverviewCharts({
  typeBreakdown,
  riskBreakdown,
  modeComparison,
}: OverviewChartsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.95fr_1fr]">
      <SectionCard
        eyebrow="Types"
        title="异常类型柱状图"
        description="聚合最近一批异常命中结果，快速判断当前最值得优先关注的问题类型。"
      >
        {typeBreakdown.length === 0 ? (
          <EmptyChart text="暂无异常类型数据" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeBreakdown}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#5f6b7a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#5f6b7a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(91,143,185,0.12)" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(58,106,154,0.28)",
                    borderRadius: "16px",
                    color: "#1f2a37",
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[10, 10, 0, 0]}
                  fill="#5b8fb9"
                  maxBarSize={56}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <SectionCard
        eyebrow="Risk"
        title="风险等级饼图"
        description="按照分析结果里的风险等级做汇总，突出高风险与待人工确认的问题占比。"
      >
        {riskBreakdown.length === 0 ? (
          <EmptyChart text="暂无风险分布数据" />
        ) : (
          <div className="grid items-center gap-5 md:grid-cols-[190px_1fr]">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskBreakdown}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={3}
                  >
                    {riskBreakdown.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      typeof value === "number" ? value : Number(value ?? 0),
                      riskLabelMap[String(name)] ?? String(name),
                    ]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(58,106,154,0.28)",
                      borderRadius: "16px",
                      color: "#1f2a37",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {riskBreakdown.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#dce4ee] bg-[#f8fafc] px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-[#314254]">
                        {riskLabelMap[item.label] ?? item.label}
                      </span>
                    </div>
                    <span className="font-semibold text-[#1f2a37]">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        eyebrow="Modes"
        title="模式对比图"
        description="这里保留 Rule、Model、Hybrid 的对比展示，用来体现混合分析的完整性和稳定性。"
      >
        {modeComparison.every(
          (item) => item.tasks === 0 && item.findings === 0 && item.avgConfidence === 0,
        ) ? (
          <EmptyChart text="暂无模式对比数据" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={modeComparison}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis
                  dataKey="mode"
                  tick={{ fill: "#5f6b7a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#5f6b7a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fill: "#5f6b7a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(58,106,154,0.28)",
                    borderRadius: "16px",
                    color: "#1f2a37",
                  }}
                />
                <Legend wrapperStyle={{ color: "#5f6b7a", paddingTop: 10 }} />
                <Bar
                  yAxisId="left"
                  dataKey="tasks"
                  name="任务数"
                  fill="#5b8fb9"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="findings"
                  name="结果条数"
                  fill="#3a6a9a"
                  radius={[8, 8, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgConfidence"
                  name="平均置信度"
                  stroke="#1f4e79"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#1f4e79" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>
    </section>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-[#cfd8e4] bg-[#f7f9fc] text-sm text-[#5f6b7a]">
      {text}
    </div>
  );
}


