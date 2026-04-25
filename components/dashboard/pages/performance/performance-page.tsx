"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { PerformanceChartRow, PerformanceModeRow, PerformancePageData } from "@/lib/dashboard/performance";

type PerformancePageProps = {
  initialData: PerformancePageData;
};

export function PerformancePage({ initialData }: PerformancePageProps) {
  const [data, setData] = useState(initialData);
  const [busy, setBusy] = useState(false);
  const [activeRange, setActiveRange] = useState(initialData.range.isCustom ? "custom" : String(initialData.days));
  const hasAnalysisRecords = data.dataSource.kind !== "empty" && data.modes.length > 0;

  async function loadRange(days: 7 | 30, startDate?: string, endDate?: string) {
    setBusy(true);
    try {
      const params = new URLSearchParams({ view: "performance", days: String(days) });
      if (startDate && endDate) {
        params.set("startDate", startDate);
        params.set("endDate", endDate);
      }
      const response = await fetch(`/api/inner-data?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      });
      const payload = (await response.json().catch(() => null)) as PerformancePageData | { error?: string } | null;
      if (!response.ok || !payload || !("metrics" in payload)) {
        throw new Error((payload && "error" in payload && payload.error) || "性能分析数据加载失败。");
      }
      setData(payload);
      setActiveRange(startDate && endDate ? "custom" : String(days));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "性能分析数据加载失败。");
    } finally {
      setBusy(false);
    }
  }

  async function handleCustomRange() {
    const defaultStart = data.range.startDate || new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const defaultEnd = data.range.endDate || new Date().toISOString().slice(0, 10);
    const startDate = window.prompt("请输入开始日期（YYYY-MM-DD）", defaultStart)?.trim();
    if (!startDate) return;
    const endDate = window.prompt("请输入结束日期（YYYY-MM-DD）", defaultEnd)?.trim();
    if (!endDate) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      window.alert("日期格式不正确，请使用 YYYY-MM-DD。");
      return;
    }
    if (startDate > endDate) {
      window.alert("开始日期不能晚于结束日期。");
      return;
    }
    await loadRange(7, startDate, endDate);
  }

  function exportPdf() {
    if (!hasAnalysisRecords) {
      window.alert("当前没有可导出的分析记录。请先完成至少一次日志分析。");
      return;
    }

    const rowsHtml = data.modes.map((item) => `<tr><td>${item.modeLabel}</td><td>${item.accuracy.toFixed(2)}%</td><td>${item.recall.toFixed(2)}%</td><td>${item.f1.toFixed(3)}</td><td>${item.latencyMs.toFixed(1)}ms</td></tr>`).join("");
    const insightsHtml = data.insights.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const win = window.open("", "_blank", "width=980,height=760");
    if (!win) {
      window.alert("浏览器阻止了导出窗口，请允许弹窗后重试。");
      return;
    }
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>性能分析报告</title><style>body{font-family:Arial,"Microsoft YaHei",sans-serif;padding:24px;color:#222}h1{font-size:22px;margin:0 0 8px}.meta{color:#666;margin-bottom:16px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}th{background:#f7f7f7}.kpi{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0 16px}.kpi div{padding:8px 10px;border:1px solid #ddd;border-radius:8px;background:#fafafa}ul{margin-top:8px}li{margin:6px 0}</style></head><body><h1>性能分析报告</h1><div class="meta">时间范围：${data.range.startDate} ~ ${data.range.endDate}</div><div class="meta">数据来源：${escapeHtml(data.dataSource.label)} · ${escapeHtml(data.dataSource.description)}</div><div class="kpi"><div>准确率：${data.metrics.accuracy.toFixed(1)}%</div><div>召回率：${data.metrics.recall.toFixed(1)}%</div><div>日均吞吐：${data.metrics.speedEps.toFixed(1)} 条/天</div></div><h3>推荐结论</h3><p>${escapeHtml(data.recommendation.summary)}</p><h3>模式明细</h3><table><thead><tr><th>模式</th><th>准确率</th><th>召回率</th><th>F1</th><th>平均延迟</th></tr></thead><tbody>${rowsHtml}</tbody></table><h3 style="margin-top:16px;">智能洞察</h3><ul>${insightsHtml}</ul></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="mx-auto w-full max-w-7xl text-[#1F2A37]">
      <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="mb-2 font-headline text-4xl font-extrabold tracking-tight">模式效果对比</h1>
          <p className="max-w-3xl text-sm leading-7 text-[#5F6B7A]">基于所选窗口的聚合数据，对比 Rule Only、Model Only、Hybrid 三种分析模式的效果与开销，帮助快速判断默认运行方案。</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="glass-panel inline-flex rounded-xl border border-[#DCE4EE] bg-[#FFFFFF] p-1 shadow-[0_10px_24px_rgba(31,59,53,0.05)]">
            <RangeButton active={activeRange === "7"} disabled={busy} onClick={() => void loadRange(7)}>最近 7 天</RangeButton>
            <RangeButton active={activeRange === "30"} disabled={busy} onClick={() => void loadRange(30)}>最近 30 天</RangeButton>
            <RangeButton active={activeRange === "custom"} disabled={busy} onClick={() => void handleCustomRange()}>自定义</RangeButton>
          </div>
          <button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 rounded-xl border border-[#DECDB6] bg-[#FFFFFF] px-5 py-2.5 text-sm font-medium text-[#5F6B7A] shadow-[0_10px_24px_rgba(31,59,53,0.06)] transition-all hover:border-[#4E7FAA]">
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            导出 PDF
          </button>
        </div>
      </header>

      <section className="glass-panel sticky top-20 z-20 mb-8 rounded-2xl border border-[#DCE4EE] p-4 shadow-[0_10px_24px_rgba(31,59,53,0.05)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">系统管理自由切换</p>
          <span className="text-[10px] text-[#97A4B2]">在三个页面之间快速跳转</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link href="/dashboard/rules" className="rounded-xl border border-[#DCE4EE] bg-white/25 px-4 py-3 text-center text-sm font-medium text-[#5F6B7A] transition-all hover:border-[#D1B58A] hover:text-[#1F2A37]">规则配置</Link>
          <button type="button" className="rounded-xl border border-[#1F4E79]/30 bg-gradient-to-r from-[#1F4E79]/20 to-transparent px-4 py-3 text-sm font-bold text-[#1F4E79]">性能分析（当前）</button>
          <Link href="/dashboard/settings" className="rounded-xl border border-[#DCE4EE] bg-white/25 px-4 py-3 text-center text-sm font-medium text-[#5F6B7A] transition-all hover:border-[#D1B58A] hover:text-[#1F2A37]">系统设置</Link>
        </div>
      </section>

      {hasAnalysisRecords ? (
        <>
      <section className="mb-8 rounded-2xl border border-[#1F4E79]/15 bg-gradient-to-r from-[#1F4E79]/10 to-transparent p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 font-label text-[10px] uppercase tracking-widest text-[#1F4E79]/80">默认推荐方案</p>
            <h2 className="mb-2 font-headline text-2xl font-extrabold">{data.recommendation.title}</h2>
            <p className="text-sm leading-7 text-[#5F6B7A]">{data.recommendation.summary}</p>
          </div>
          <div className="w-full max-w-md rounded-2xl border border-[#DCE4EE] bg-white/35 p-4 text-sm text-[#5F6B7A]">
            <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">当前待复核</p>
            <p className="mt-2 font-headline text-3xl font-black text-[#1F4E79]">{data.pendingReviewCount}</p>
            {data.recommendation.footnote ? (
              <p className="mt-2 text-xs leading-6">{data.recommendation.footnote}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {data.recommendation.evidence.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-xl border border-[#DCE4EE] bg-white/35 px-4 py-4">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-[#7B8898]">{`证据 ${index + 1}`}</p>
              <p className="text-sm leading-6 text-[#314254]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard accent="primary" metric={data.focusMetrics.accuracy} />
        <MetricCard accent="secondary" metric={data.focusMetrics.recall} />
        <MetricCard accent="tertiary" metric={data.focusMetrics.latency} />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <div className="glass-panel rounded-[28px] border border-[#DCE4EE] p-8 shadow-[0_12px_30px_rgba(31,59,53,0.06)]">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-headline text-xl font-bold">模式效果对比</h3>
              <p className="mt-2 text-xs leading-6 text-[#7B8898]">从准确率、召回率、吞吐量和资源消耗四个口径看当前模式的窗口表现。</p>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-[#7B8898]">
              {data.availableModes.includes("rule_only") ? <Legend color="bg-[#5B9DFF]" label="规则" /> : null}
              {data.availableModes.includes("model_only") ? <Legend color="bg-[#9A6B3F]" label="模型" /> : null}
              {data.availableModes.includes("hybrid") ? <Legend color="bg-[#7B5CFA]" label="混合" /> : null}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {data.chart.map((item) => <ChartGroup key={item.label} item={item} availableModes={data.availableModes} />)}
          </div>
        </div>

        <aside className="space-y-6">
          <section className="obsidian-card rounded-[28px] border border-[#DCE4EE] p-6 shadow-[0_12px_30px_rgba(31,59,53,0.08)]">
            <h3 className="mb-4 text-lg font-bold">窗口洞察</h3>
            <div className="space-y-4">
              {data.insights.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-2xl bg-[#F4FFFB] px-4 py-4 text-sm leading-7 text-[#314254]">
                  <p className="mb-2 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">{`洞察 ${index + 1}`}</p>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="obsidian-card rounded-[28px] border border-[#DCE4EE] p-6 shadow-[0_12px_30px_rgba(31,59,53,0.08)]">
            <h3 className="mb-4 text-lg font-bold">综合指标</h3>
            <div className="space-y-4">
              <MiniStat label="窗口平均准确率" value={`${data.metrics.accuracy.toFixed(1)}%`} delta={formatDelta(data.metrics.accuracyDelta, "个点")} />
              <MiniStat label="窗口平均召回率" value={`${data.metrics.recall.toFixed(1)}%`} delta={formatDelta(data.metrics.recallDelta, "个点")} />
              <MiniStat label="日均吞吐量" value={`${data.metrics.speedEps.toFixed(1)} 条`} delta={formatDelta(data.metrics.speedDelta, "条")} />
            </div>
          </section>
        </aside>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#DCE4EE] bg-[#FFFFFF] shadow-[0_14px_34px_rgba(31,59,53,0.08)]">
        <div className="border-b border-[#DCE4EE] bg-[#F4FFFB] px-8 py-5">
          <h3 className="font-headline text-xl font-bold">模式明细</h3>
          <p className="mt-2 text-xs leading-6 text-[#7B8898]">准确率、召回率、F1 与平均延迟来自当前对比口径，用于快速观察三模式差异。</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#DCE4EE] bg-white/30">
                <th className="px-8 py-4 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">模式</th>
                <th className="px-6 py-4 text-right font-label text-[10px] uppercase tracking-widest text-[#7B8898]">准确率</th>
                <th className="px-6 py-4 text-right font-label text-[10px] uppercase tracking-widest text-[#7B8898]">召回率</th>
                <th className="px-6 py-4 text-right font-label text-[10px] uppercase tracking-widest text-[#7B8898]">F1</th>
                <th className="px-6 py-4 text-right font-label text-[10px] uppercase tracking-widest text-[#7B8898]">平均延迟</th>
                <th className="px-8 py-4 text-center font-label text-[10px] uppercase tracking-widest text-[#7B8898]">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCCB]">
              {data.modes.map((item) => <ModeRow key={item.modeKey} item={item} />)}
            </tbody>
          </table>
        </div>
      </section>
      </>
      ) : (
        <section className="rounded-[28px] border border-[#DCE4EE] bg-[#FFFFFF] p-10 text-center shadow-[0_14px_34px_rgba(31,59,53,0.08)]">
          <p className="font-headline text-2xl font-bold text-[#1F2A37]">当前窗口没有分析记录</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#5F6B7A]">请先完成至少一次分析任务，结果将在此页面自动更新展示。</p>
          <Link href="/upload" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#1F4E79]/20 bg-[#1F4E79]/10 px-5 py-2.5 text-sm font-semibold text-[#1F4E79] transition-all hover:bg-[#1F4E79]/15">
            <span className="material-symbols-outlined text-base">upload</span>
            去上传并开始分析
          </Link>
        </section>
      )}
    </div>
  );
}

function RangeButton({ active, disabled, onClick, children }: { active: boolean; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={active ? "rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#1F4E79] shadow-sm" : "rounded-lg px-4 py-2 text-sm font-medium text-[#5F6B7A] transition-all hover:text-[#1F2A37] disabled:opacity-50"}>{children}</button>;
}

function MetricCard({ metric, accent }: { metric: PerformancePageData["focusMetrics"]["accuracy"]; accent: "primary" | "secondary" | "tertiary" }) {
  const icon = accent === "primary" ? "verified" : accent === "secondary" ? "track_changes" : "speed";
  const accentClass = accent === "primary" ? "text-[#1F4E79]" : accent === "secondary" ? "text-[#3A6A9A]" : "text-[#C58B52]";
  const gradient = accent === "primary" ? "from-[#1F4E79] to-[#3A6A9A]" : accent === "secondary" ? "from-[#3A6A9A] to-[#C58B52]" : "from-[#C58B52] to-[#1F4E79]";
  return <div className="glass-panel rounded-2xl border border-[#DCE4EE] p-6 shadow-[0_10px_24px_rgba(31,59,53,0.05)]"><div className="mb-4 flex items-start justify-between"><span className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">{metric.label}</span><span className={`material-symbols-outlined ${accentClass}`}>{icon}</span></div><div className="flex items-end gap-2"><span className="font-headline text-4xl font-extrabold text-[#1F2A37]">{metric.value.toFixed(1)}{metric.unit}</span></div><p className={`mt-2 text-xs font-bold ${accentClass}`}>{`${metric.compareLabel} ${metric.compareText}`}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E6D9C7]"><div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${Math.max(0, Math.min(100, metric.barPercent))}%` }} /></div><p className="mt-3 text-xs text-[#7B8898]">{metric.note}</p></div>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span>{label}</span></span>;
}

function ChartGroup({ item, availableModes }: { item: PerformanceChartRow; availableModes: PerformancePageData["availableModes"] }) {
  const allBars = [
    { mode: "rule_only", label: "规则", value: item.ruleOnly, color: "bg-[#5B9DFF]/70 border-[#5B9DFF]" },
    { mode: "model_only", label: "模型", value: item.modelOnly, color: "bg-[#9A6B3F]/82 border-[#9A6B3F]" },
    { mode: "hybrid", label: "混合", value: item.hybrid, color: "bg-[#7B5CFA]/85 border-[#7B5CFA]" },
  ];
  const bars = allBars.filter((bar) => availableModes.includes(bar.mode as PerformancePageData["availableModes"][number]));
  const compareLabel = `${Math.max(1, bars.length)}模式对比`;
  const localMax = Math.max(1, ...bars.map((bar) => bar.value));
  const hasAnyValue = bars.some((bar) => bar.value > 0);

  return <div className="rounded-2xl border border-[#DCE4EE] bg-[#F4FFFB] p-5"><div className="mb-5 flex items-center justify-between gap-3"><h4 className="text-sm font-bold text-[#1F2A37]">{item.label}</h4><span className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">{compareLabel}</span></div><div className="flex items-end gap-4">{bars.map((bar) => <div key={`${item.label}-${bar.label}`} className="flex flex-1 flex-col items-center gap-2"><div className="text-[10px] font-label uppercase tracking-widest text-[#7B8898]">{bar.value.toFixed(1)}</div><div className="flex h-36 w-full items-end rounded-2xl bg-white/60 px-3 pb-3"><div className={`w-full rounded-t-xl border ${bar.color}`} style={{ height: `${Math.max(8, hasAnyValue ? (bar.value / localMax) * 100 : 8)}%` }} /></div><div className="text-[10px] uppercase tracking-widest text-[#5F6B7A]">{bar.label}</div></div>)}</div></div>;
}

function MiniStat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return <div className="rounded-2xl bg-[#F4FFFB] px-4 py-4"><p className="text-[10px] uppercase tracking-widest text-[#7B8898]">{label}</p><p className="mt-2 font-headline text-3xl font-black text-[#1F2A37]">{value}</p><p className="mt-2 text-xs text-[#5F6B7A]">{delta}</p></div>;
}

function ModeRow({ item }: { item: PerformanceModeRow }) {
  const badgeClass = item.status === "recommended" ? "border border-[#7B5CFA]/25 bg-[#7B5CFA]/12 text-[#5A3ED8]" : item.status === "high_load" ? "border border-[#9A6B3F]/25 bg-[#9A6B3F]/12 text-[#7A522C]" : "border border-[#5B9DFF]/40 bg-[#5B9DFF]/15 text-[#2D6DAD]";
  return <tr className="transition-colors hover:bg-[#F4FFFB]"><td className="px-8 py-5 text-sm font-bold text-[#1F2A37]">{item.modeLabel}</td><td className="px-6 py-5 text-right font-label text-[#5F6B7A]">{item.accuracy.toFixed(2)}%</td><td className="px-6 py-5 text-right font-label text-[#5F6B7A]">{item.recall.toFixed(2)}%</td><td className="px-6 py-5 text-right font-label text-[#5F6B7A]">{item.f1.toFixed(3)}</td><td className="px-6 py-5 text-right font-label text-[#5F6B7A]">{item.latencyMs.toFixed(1)}ms</td><td className="px-8 py-5 text-center"><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${badgeClass}`}>{item.status === "recommended" ? "推荐运行" : item.status === "high_load" ? "高负载" : "基线模式"}</span></td></tr>;
}

function formatDelta(value: number, unit: string) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "±";
  return `${prefix}${Math.abs(value).toFixed(1)} ${unit}`;
}

function escapeHtml(value: string) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}
