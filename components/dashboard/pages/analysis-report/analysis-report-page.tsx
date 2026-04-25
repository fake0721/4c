"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisReportData } from "@/lib/dashboard/analysis-report";

type AnalysisReportPageProps = {
  data: AnalysisReportData;
};

const RISK_VISUALS = {
  高风险: {
    color: "#D84B3E",
    fill: "#FFF0ED",
    border: "#F2C1BA",
    text: "#A12F24",
    shadow: "0 14px 32px rgba(216,75,62,0.16)",
  },
  中风险: {
    color: "#C88922",
    fill: "#FFF7E8",
    border: "#ECD2A2",
    text: "#8B5B10",
    shadow: "0 12px 28px rgba(200,137,34,0.12)",
  },
  低风险: {
    color: "#2F8F7F",
    fill: "#EAF7F3",
    border: "#BEE0D6",
    text: "#21685C",
    shadow: "0 12px 26px rgba(47,143,127,0.1)",
  },
  默认: {
    color: "#6C7C8F",
    fill: "#F4F7FA",
    border: "#D7E0E9",
    text: "#4E5D70",
    shadow: "0 10px 24px rgba(108,124,143,0.08)",
  },
} as const;

export function AnalysisReportPage({ data }: AnalysisReportPageProps) {
  const router = useRouter();
  const isProcessing = data.log.status === "processing";
  const [exportingPdf, setExportingPdf] = useState(false);
  const confidencePercent = Math.round((data.summary.avgConfidence || 0) * 100);
  const totalRisk = Math.max(1, data.riskDistribution.high + data.riskDistribution.medium + data.riskDistribution.low);

  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    const timerId = window.setInterval(() => {
      router.refresh();
    }, 3000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isProcessing, router]);

  const riskItems = useMemo(
    () => [
      { label: "高风险", count: data.riskDistribution.high, color: RISK_VISUALS.高风险.color },
      { label: "中风险", count: data.riskDistribution.medium, color: RISK_VISUALS.中风险.color },
      { label: "低风险", count: data.riskDistribution.low, color: RISK_VISUALS.低风险.color },
    ],
    [data.riskDistribution.high, data.riskDistribution.low, data.riskDistribution.medium],
  );

  const riskGradient = useMemo(() => {
    let current = 0;
    const segments = riskItems.map((item) => {
      const percent = totalRisk > 0 ? (item.count / totalRisk) * 100 : 0;
      const start = current;
      const end = current + percent;
      current = end;
      return `${item.color} ${start}% ${end}%`;
    });

    return `conic-gradient(${segments.join(", ")})`;
  }, [riskItems, totalRisk]);

  function exportWord() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>分析报告</title><style>body{font-family:Arial,"Microsoft YaHei",sans-serif;padding:24px;color:#222}h1,h2{margin:0 0 12px}h2{margin-top:24px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}th{background:#f7f7f7}</style></head><body><h1>日志分析报告</h1><p>报告ID：${data.summary.reportId}</p><p>日志文件：${data.log.fileName}</p><p>分析时间：${formatDateTime(data.log.createdAt)}</p><h2>摘要</h2><ul><li>问题总数：${data.summary.totalIssues}</li><li>高风险问题：${data.summary.highRiskCount}</li><li>主要异常类型：${data.summary.topType}</li><li>建议复核：${data.summary.needsReview ? "是" : "否"}</li></ul><h2>问题明细</h2><table><thead><tr><th>事件ID</th><th>类型</th><th>风险</th><th>置信度</th><th>建议</th></tr></thead><tbody>${data.detailRows.map((item) => `<tr><td>${item.incidentId}</td><td>${item.type}</td><td>${item.riskLabel}</td><td>${Math.round(item.confidence * 100)}%</td><td>${item.suggestion}</td></tr>`).join("")}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFileName(data.log.fileName)}-分析报告.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function exportPdf() {
    if (exportingPdf) {
      return;
    }

    setExportingPdf(true);
    try {
      const [{ jsPDF }] = await Promise.all([import("jspdf"), document.fonts?.ready ?? Promise.resolve()]);

      if (!jsPDF) {
        window.alert("PDF 导出依赖不可用，请稍后重试。");
        return;
      }

      const pages = buildAnalysisReportPdfPages({
        data,
        confidencePercent,
        riskItems,
        totalRisk,
      });

      const pdf = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4",
        compress: true,
      });

      if (pages.length === 0) {
        window.alert("报告内容为空，暂时无法导出 PDF。");
        return;
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pages.forEach((canvas, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(canvas, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
      });

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sanitizeFileName(data.log.fileName)}-分析报告.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("analysis report pdf export failed", error);
      window.alert("PDF 导出失败，请稍后重试。");
    } finally {
      setExportingPdf(false);
    }
  }

  function submitReview() {
    router.push(`/dashboard/reviews?logId=${encodeURIComponent(data.log.id)}&from=analysis-report`);
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      {isProcessing ? (
        <section className="mb-6 rounded-2xl border border-[#E8D3A1] bg-[#FFF5DE] px-4 py-3 text-sm text-[#8A6A24]">
          当前日志仍在分析中，页面将每 3 秒自动刷新一次，完成后会自动显示最新报告内容。
        </section>
      ) : null}

      <header className="mb-10 flex flex-col gap-6 pt-2 xl:flex-row xl:items-start xl:justify-between" data-pdf-section="header">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 font-label text-sm uppercase tracking-widest text-[#7B8898]">
            <span>{`报告 ID: ${data.summary.reportId}`}</span>
            <span className="h-1 w-1 rounded-full bg-[#CBD7E4]" />
            <span>{formatDateTime(data.log.createdAt)}</span>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-[#1F2A37]">{data.log.fileName}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#BFDDC9] bg-[#E8F4EC] px-3 py-1 text-xs font-label text-[#2F6A42]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3B925F]" />
                {data.log.statusLabel}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-label ${data.summary.needsReview ? "border border-[#E8D3A1] bg-[#FFF5DE] text-[#8A6A24]" : "border border-[#CBD7E4] bg-[#E9EDF3] text-[#5F6B7A]"}`}>
                <span className="material-symbols-outlined text-xs">priority_high</span>
                {data.summary.needsReview ? "建议复核" : "复核可选"}
              </span>
            </div>
          </div>
          <p className="text-sm text-[#5F6B7A]">{`分析平均置信度: ${confidencePercent}% · 日志大小: ${data.log.fileSizeLabel}`}</p>
        </div>
        <div className="flex flex-wrap gap-3" data-pdf-hide="true">
          <button type="button" onClick={exportWord} className="glass-card inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-[#1F2A37] transition-colors hover:bg-[#E9EDF3]">
            <span className="material-symbols-outlined text-sm">description</span>
            导出 Word
          </button>
          <button
            type="button"
            onClick={exportPdf}
            disabled={exportingPdf}
            className="glass-card inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-[#1F2A37] transition-colors hover:bg-[#E9EDF3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            {exportingPdf ? "导出中..." : "导出 PDF"}
          </button>
          <button type="button" onClick={submitReview} className="inline-flex items-center gap-2 rounded-lg border border-[#1F4E79]/30 bg-[#1F4E79]/12 px-4 py-2 text-sm font-bold text-[#1F4E79] transition-all hover:bg-[#1F4E79]/20">
            <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
            提交复核
          </button>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4" data-pdf-section="summary">
        <SummaryCard label="问题总数" value={String(data.summary.totalIssues)} hint="已识别异常样本" accent="default" />
        <SummaryCard label="高风险问题数" value={String(data.summary.highRiskCount)} hint="需优先处理" accent="warning" />
        <SummaryCard label="主要异常类型" value={data.summary.topType} hint={`出现次数 ${data.summary.topTypeCount}`} accent="soft" />
        <SummaryCard label="建议优先处理项" value={data.summary.topSuggestion} hint={`平均置信度 ${confidencePercent}%`} accent="primary" />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-12" data-pdf-section="distribution">
        <div className="glass-card rounded-2xl p-8 xl:col-span-7">
          <h2 className="mb-8 flex items-center gap-2 text-lg font-bold text-[#1F2A37]">
            <span className="material-symbols-outlined text-[#5D7B97]">bar_chart</span>
            问题类型分布
          </h2>
          <div className="space-y-6">
            {data.problemTypes.length > 0 ? (
              data.problemTypes.map((item, index) => {
                const tone = TYPE_DISTRIBUTION_TONES[index % TYPE_DISTRIBUTION_TONES.length];
                return (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between text-xs font-label uppercase tracking-wider text-[#7B8898]">
                    <span>{item.name}</span>
                    <span style={{ color: tone.text }}>{`${item.count} (${item.percent}%)`}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#E7EEF5]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(item.percent, 4)}%`,
                        background: `linear-gradient(90deg, ${tone.start}, ${tone.end})`,
                      }}
                    />
                  </div>
                </div>
              );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[#CBD7E4] bg-[#F4FFFB] px-6 py-10 text-center text-sm text-[#7B8898]">暂无问题类型分布数据</div>
            )}
          </div>
        </div>

        <div className="glass-card flex flex-col rounded-2xl p-8 xl:col-span-5">
          <h2 className="mb-8 flex items-center gap-2 text-lg font-bold text-[#1F2A37]">
            <span className="material-symbols-outlined text-[#D84B3E]">donut_large</span>
            风险等级分布
          </h2>
          <div className="flex flex-1 flex-col justify-center gap-6 md:flex-row md:items-center">
            <div
              className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full shadow-[0_24px_48px_rgba(216,75,62,0.14),inset_0_0_0_1px_rgba(255,255,255,0.34)]"
              style={{ background: riskGradient }}
            >
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-white/70 bg-[#FFFDFC] shadow-[0_12px_30px_rgba(31,59,53,0.08)]">
                <div className="font-headline text-3xl font-black text-[#1F2A37]">{data.summary.totalIssues}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.22em] text-[#7B8898]">总问题数</div>
              </div>
            </div>
            <div className="space-y-4">
              {riskItems.map((item) => {
                const visual = riskBadgeColors(item.label);
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: visual.fill,
                      borderColor: visual.border,
                      boxShadow: visual.shadow,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <div>
                        <div className="text-sm font-bold" style={{ color: visual.text }}>
                          {item.label}
                        </div>
                        <div className="text-xs text-[#6E7C8B]">{`${item.count} 个问题`}</div>
                      </div>
                    </div>
                    <span className="text-sm font-black" style={{ color: visual.text }}>
                      {`${Math.round((item.count / totalRisk) * 100)}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10 glass-card rounded-2xl p-8" data-pdf-section="insights">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1F2A37]">
              <span className="material-symbols-outlined text-[#1F4E79]">network_intelligence</span>
              根因分析
            </h2>
            <div className="rounded-2xl border border-[#DCE4EE] bg-[#F4FFFB] p-6 text-base leading-8 text-[#314254]">
              {data.summary.topCause}
            </div>
          </div>
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1F2A37]">
              <span className="material-symbols-outlined text-[#1F4E79]">lightbulb</span>
              优先建议
            </h2>
            <div className="space-y-3 rounded-2xl border border-[#DCE4EE] bg-[#F4FFFB] p-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#CBD7E4] bg-white/50 px-3 py-1 text-xs font-label uppercase tracking-widest text-[#5F6B7A]">
                <span className="material-symbols-outlined text-sm">bolt</span>
                {data.summary.needsReview ? "建议复核" : "系统建议"}
              </div>
              <p className="text-sm leading-7 text-[#314254]">{data.summary.topSuggestion}</p>
              <p className="text-xs text-[#7B8898]">当前主要异常类型为 {data.summary.topType}，系统建议优先确认高风险问题的处理动作。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4" data-pdf-section="details">
        <div className="flex items-center gap-2 text-sm font-medium text-[#7B8898]" data-pdf-detail-intro="true">
          <span className="material-symbols-outlined text-sm">info</span>
          {`共匹配到 ${data.detailRows.length} 个问题样本`}
        </div>
        {data.detailRows.length > 0 ? (
          data.detailRows.map((item) => (
            <article key={item.id} className="glass-card overflow-hidden rounded-2xl border border-[#DCE4EE] p-6 shadow-[0_10px_24px_rgba(31,59,53,0.05)]" data-pdf-detail-card="true">
              <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-[#1F2A37]">{item.type}</h3>
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold"
                      style={{
                        backgroundColor: riskBadgeColors(item.riskLabel).fill,
                        borderColor: riskBadgeColors(item.riskLabel).border,
                        color: riskBadgeColors(item.riskLabel).text,
                      }}
                    >
                      {item.riskLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#E9EDF3] px-3 py-1 text-xs text-[#5F6B7A]">{`置信度 ${Math.round(item.confidence * 100)}%`}</span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#7B8898]">{`事件 ID ${item.incidentId} · 行号 ${item.lineNumber}`}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl bg-[#F4FFFB] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7B8898]">根因判断</p>
                  <p className="mt-2 text-sm leading-7 text-[#2F2926]">{item.cause}</p>
                </div>
                <div className="rounded-2xl bg-[#F4FFFB] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A17442]">处理建议</p>
                  <p className="mt-2 text-sm leading-7 text-[#2F2926]">{item.suggestion}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-[#241F1B] px-4 py-3 shadow-inner shadow-black/20">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F3E7D3]">日志片段</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-[#F8F3EA]">{item.snippet || "暂无日志片段"}</pre>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#CBD7E4] bg-[#F4FFFB] px-6 py-12 text-center text-sm text-[#7B8898]" data-pdf-detail-empty="true">暂无问题详情数据</div>
        )}
      </section>

    </div>
  );
}

function SummaryCard({ label, value, hint, accent }: { label: string; value: string; hint: string; accent: "default" | "warning" | "soft" | "primary" }) {
  const [expanded, setExpanded] = useState(false);
  const accentClass =
    accent === "warning"
      ? "border-l-4 border-[#E68A17]"
      : accent === "primary"
        ? "border border-[#1F4E79]/20"
        : "";
  const valueClass = accent === "warning" ? "text-[#E68A17]" : accent === "primary" ? "text-[#1F4E79]" : "text-[#1F2A37]";
  const showAsNarrative = accent === "primary" && value.length > 20;
  const canToggle = showAsNarrative && value.length > 24;
  const displayValue = canToggle && !expanded ? `${value.slice(0, 24)}...` : value;
  const valueSizeClass = showAsNarrative ? "text-[clamp(1.1rem,1.35vw,1.55rem)] leading-[1.45]" : "text-4xl leading-none";
  const valueContainerClass = showAsNarrative && expanded ? "max-h-36 overflow-y-auto pr-1" : "";
  const valueWeightClass = showAsNarrative ? "font-bold" : "font-black";

  return (
    <div className={`glass-card relative overflow-hidden rounded-2xl p-6 ${accentClass}`}>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#1F4E79]/10 blur-3xl" />
      <p className="mb-2 font-label text-xs uppercase tracking-widest text-[#7B8898]">{label}</p>
      <h3 className={`font-headline break-words whitespace-normal ${valueClass} ${valueSizeClass} ${valueContainerClass} ${valueWeightClass}`}>{displayValue}</h3>
      {canToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-xs font-semibold text-[#165DFF] transition-colors hover:text-[#0E42D2]"
        >
          {expanded ? "收起" : "展开"}
        </button>
      ) : null}
      <div className="mt-4 text-xs text-[#7B8898]">{hint}</div>
    </div>
  );
}

type PdfBuildInput = {
  data: AnalysisReportData;
  confidencePercent: number;
  totalRisk: number;
  riskItems: Array<{ label: string; count: number; color: string }>;
};

type PdfPageState = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cursorY: number;
};

const PDF_CANVAS_WIDTH = 1122;
const PDF_CANVAS_HEIGHT = 1587;
const PDF_MARGIN_X = 74;
const PDF_MARGIN_TOP = 118;
const PDF_MARGIN_BOTTOM = 92;
const PDF_CONTENT_LEFT = PDF_MARGIN_X;
const PDF_CONTENT_TOP = PDF_MARGIN_TOP;
const PDF_CONTENT_WIDTH = PDF_CANVAS_WIDTH - PDF_MARGIN_X * 2;
const PDF_CONTENT_BOTTOM = PDF_CANVAS_HEIGHT - PDF_MARGIN_BOTTOM;
const PDF_THEME = {
  accent: "#1F4E79",
  accentSoft: "#F3E7D7",
  ink: "#2F2926",
  muted: "#7A6F64",
  line: "#DCCDB8",
  panel: "#FBF8F3",
  panelStrong: "#F5EEE5",
};

const TYPE_DISTRIBUTION_TONES = [
  { start: "#5D7B97", end: "#87A3BD", text: "#496580" },
  { start: "#6B89A3", end: "#99B5CC", text: "#56738E" },
  { start: "#7896AE", end: "#ADC2D7", text: "#607B95" },
  { start: "#64839D", end: "#93AEC7", text: "#4F6C86" },
  { start: "#819BB3", end: "#B7CADE", text: "#687F98" },
];

function buildAnalysisReportPdfPages({ data, confidencePercent, totalRisk, riskItems }: PdfBuildInput) {
  const pages: PdfPageState[] = [createPdfPage()];
  let page = pages[0];

  const ensureSpace = (height: number) => {
    if (page.cursorY + height <= PDF_CONTENT_BOTTOM) {
      return;
    }
    page = createPdfPage();
    pages.push(page);
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(46);
    drawText(page.ctx, title, PDF_CONTENT_LEFT, page.cursorY, {
      font: "700 24px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.ink,
    });
    drawLine(page.ctx, PDF_CONTENT_LEFT, page.cursorY + 30, PDF_CONTENT_LEFT + PDF_CONTENT_WIDTH, page.cursorY + 30, PDF_THEME.line, 2);
    page.cursorY += 42;
  };

  const drawBodyText = (text: string, width: number, options?: { color?: string; font?: string; lineHeight?: number }) => {
    const font = options?.font ?? "400 20px 'Microsoft YaHei', sans-serif";
    const lineHeight = options?.lineHeight ?? 30;
    const lines = wrapCanvasText(page.ctx, text, width, font);
    ensureSpace(lines.length * lineHeight);
    drawWrappedLines(page.ctx, lines, PDF_CONTENT_LEFT, page.cursorY, {
      font,
      color: options?.color ?? PDF_THEME.ink,
      lineHeight,
    });
    page.cursorY += lines.length * lineHeight;
  };

  page.cursorY = drawReportHeader(page.ctx, {
    title: "日志分析报告",
    fileName: data.log.fileName,
    reportId: data.summary.reportId,
    createdAt: formatDateTime(data.log.createdAt),
    fileSizeLabel: data.log.fileSizeLabel,
    confidencePercent,
    statusLabel: data.log.statusLabel,
    reviewLabel: data.summary.needsReview ? "建议复核" : "复核可选",
    badges: [
      { label: data.log.statusLabel, fill: "#E8F4EC", text: "#2F6A42", border: "#BFDDC9" },
      { label: data.summary.needsReview ? "建议复核" : "复核可选", fill: data.summary.needsReview ? "#FFF5DE" : "#E9EDF3", text: data.summary.needsReview ? "#8A6A24" : "#5F6B7A", border: data.summary.needsReview ? "#E8D3A1" : "#CBD7E4" },
      { label: `平均置信度 ${confidencePercent}%`, fill: "#F4FFFB", text: "#1F4E79", border: "#DCE4EE" },
    ],
  });
  page.cursorY += 24;

  drawSectionTitle("报告摘要");
  const overview = `本次分析共识别 ${data.summary.totalIssues} 个问题样本，其中高风险 ${data.summary.highRiskCount} 个。主要异常类型为 ${data.summary.topType}，系统平均置信度为 ${confidencePercent}%。`;
  const overviewHeight = estimateNarrativeBlockHeight(page.ctx, overview, PDF_CONTENT_WIDTH - 60, "400 20px 'Microsoft YaHei', sans-serif", 30, 28);
  ensureSpace(overviewHeight);
  drawNarrativeBlock(page.ctx, PDF_CONTENT_LEFT, page.cursorY, PDF_CONTENT_WIDTH, overviewHeight, overview, {
    fill: "#FCF8F3",
    stripe: PDF_THEME.accent,
  });
  page.cursorY += overviewHeight + 18;

  const metricHeight = drawMetricGrid(page.ctx, page.cursorY, [
    { label: "问题总数", value: String(data.summary.totalIssues), hint: "已识别异常样本" },
    { label: "高风险问题", value: String(data.summary.highRiskCount), hint: "需优先处理" },
    { label: "主要异常类型", value: data.summary.topType, hint: `出现次数 ${data.summary.topTypeCount}` },
    { label: "建议优先项", value: truncateText(data.summary.topSuggestion, 12), hint: `平均置信度 ${confidencePercent}%` },
  ]);
  page.cursorY += metricHeight + 24;

  drawSectionTitle("问题类型分布");
  const typeBlockHeight = estimateProblemTypeTableHeight(data.problemTypes.length);
  ensureSpace(typeBlockHeight);
  drawProblemTypesTable(page.ctx, page.cursorY, data.problemTypes);
  page.cursorY += typeBlockHeight + 26;

  drawSectionTitle("风险等级分布");
  const riskBlockHeight = 176;
  ensureSpace(riskBlockHeight);
  drawRiskSummary(page.ctx, page.cursorY, totalRisk, riskItems);
  page.cursorY += riskBlockHeight + 26;

  drawSectionTitle("根因分析");
  const causeHeight = estimateNarrativeBlockHeight(page.ctx, data.summary.topCause, PDF_CONTENT_WIDTH - 60, "400 20px 'Microsoft YaHei', sans-serif", 30, 30);
  ensureSpace(causeHeight);
  drawNarrativeBlock(page.ctx, PDF_CONTENT_LEFT, page.cursorY, PDF_CONTENT_WIDTH, causeHeight, data.summary.topCause, {
    fill: "#FBF8F3",
    stripe: "#B28B61",
  });
  page.cursorY += causeHeight + 20;

  drawSectionTitle("处理建议");
  const suggestionHeight = estimateNarrativeBlockHeight(page.ctx, data.summary.topSuggestion, PDF_CONTENT_WIDTH - 60, "400 20px 'Microsoft YaHei', sans-serif", 30, 30);
  ensureSpace(suggestionHeight);
  drawNarrativeBlock(page.ctx, PDF_CONTENT_LEFT, page.cursorY, PDF_CONTENT_WIDTH, suggestionHeight, data.summary.topSuggestion, {
    fill: "#FBF8F3",
    stripe: "#D8A94A",
  });
  page.cursorY += suggestionHeight + 20;

  drawSectionTitle("问题明细");
  drawBodyText(`共匹配到 ${data.detailRows.length} 个问题样本`, PDF_CONTENT_WIDTH, {
    color: PDF_THEME.muted,
    font: "500 18px 'Microsoft YaHei', sans-serif",
    lineHeight: 28,
  });
  page.cursorY += 14;

  if (data.detailRows.length === 0) {
    ensureSpace(96);
    drawInfoPanel(page.ctx, PDF_CONTENT_LEFT, page.cursorY, PDF_CONTENT_WIDTH, 96, PDF_THEME.panel);
    drawText(page.ctx, "暂无问题详情数据", PDF_CONTENT_LEFT + 28, page.cursorY + 36, {
      font: "400 20px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.muted,
    });
  } else {
    data.detailRows.forEach((item) => {
      const cardHeight = estimateDetailCardHeight(page.ctx, item);
      ensureSpace(cardHeight);
      drawDetailCard(page.ctx, page.cursorY, item);
      page.cursorY += cardHeight + 18;
    });
  }

  pages.forEach((item, index) => {
    stampPdfPageDecorations(item.ctx, index + 1, pages.length, data.summary.reportId);
  });

  return pages.map((item) => item.canvas);
}

function createPdfPage(): PdfPageState {
  const canvas = document.createElement("canvas");
  canvas.width = PDF_CANVAS_WIDTH;
  canvas.height = PDF_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("pdf canvas context unavailable");
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, PDF_CANVAS_WIDTH, PDF_CANVAS_HEIGHT);

  return {
    canvas,
    ctx,
    cursorY: PDF_CONTENT_TOP,
  };
}

function drawReportHeader(
  ctx: CanvasRenderingContext2D,
  input: {
    title: string;
    fileName: string;
    reportId: string;
    createdAt: string;
    fileSizeLabel: string;
    confidencePercent: number;
    statusLabel: string;
    reviewLabel: string;
    badges: Array<{ label: string; fill: string; text: string; border: string }>;
  },
) {
  ctx.fillStyle = PDF_THEME.accentSoft;
  ctx.fillRect(0, 0, PDF_CANVAS_WIDTH, 66);

  drawText(ctx, "ANALYSIS REPORT", PDF_CONTENT_LEFT, PDF_CONTENT_TOP - 54, {
    font: "700 13px 'Segoe UI', sans-serif",
    color: PDF_THEME.accent,
  });
  drawText(ctx, input.title, PDF_CONTENT_LEFT, PDF_CONTENT_TOP, {
    font: "700 36px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.ink,
  });
  drawText(ctx, input.fileName, PDF_CONTENT_LEFT, PDF_CONTENT_TOP + 46, {
    font: "500 22px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.accent,
  });
  drawText(ctx, "系统基于当前日志分析结果自动生成本报告，供人工复核与归档使用。", PDF_CONTENT_LEFT, PDF_CONTENT_TOP + 82, {
    font: "400 17px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.muted,
  });
  drawBadgeRow(ctx, PDF_CONTENT_LEFT, PDF_CONTENT_TOP + 114, input.badges);

  const metaHeight = drawMetaGrid(ctx, PDF_CONTENT_LEFT, PDF_CONTENT_TOP + 166, PDF_CONTENT_WIDTH, [
    { label: "报告编号", value: input.reportId },
    { label: "分析时间", value: input.createdAt },
    { label: "日志大小", value: input.fileSizeLabel },
    { label: "当前状态", value: input.statusLabel },
    { label: "建议动作", value: input.reviewLabel },
    { label: "平均置信度", value: `${input.confidencePercent}%` },
  ]);

  return PDF_CONTENT_TOP + 166 + metaHeight;
}

function stampPdfPageDecorations(ctx: CanvasRenderingContext2D, pageNumber: number, totalPages: number, reportId: string) {
  drawLine(ctx, PDF_CONTENT_LEFT, 78, PDF_CONTENT_LEFT + PDF_CONTENT_WIDTH, 78, PDF_THEME.line, 1.5);
  drawText(ctx, "日志分析报告", PDF_CONTENT_LEFT, 48, {
    font: "600 14px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.muted,
  });
  drawText(ctx, `报告编号 ${reportId}`, PDF_CONTENT_LEFT + PDF_CONTENT_WIDTH, 48, {
    font: "400 14px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.muted,
    align: "right",
  });
  drawLine(ctx, PDF_CONTENT_LEFT, PDF_CANVAS_HEIGHT - 56, PDF_CONTENT_LEFT + PDF_CONTENT_WIDTH, PDF_CANVAS_HEIGHT - 56, PDF_THEME.line, 1.5);
  drawText(ctx, `第 ${pageNumber} / ${totalPages} 页`, PDF_CONTENT_LEFT + PDF_CONTENT_WIDTH, PDF_CANVAS_HEIGHT - 42, {
    font: "400 14px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.muted,
    align: "right",
  });
}

function drawMetaGrid(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, items: Array<{ label: string; value: string }>) {
  const gap = 16;
  const colWidth = (width - gap) / 2;
  const rowHeight = 56;
  const rows = Math.ceil(items.length / 2);

  items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const cellX = x + col * (colWidth + gap);
    const cellY = y + row * (rowHeight + 10);
    drawRoundedRect(ctx, cellX, cellY, colWidth, rowHeight, 12, "#FFFFFF", PDF_THEME.line);
    drawText(ctx, item.label, cellX + 18, cellY + 12, {
      font: "500 14px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.muted,
    });
    drawText(ctx, item.value, cellX + 18, cellY + 30, {
      font: "600 17px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.ink,
    });
  });

  return rows * rowHeight + Math.max(0, rows - 1) * 10;
}

function drawMetricGrid(ctx: CanvasRenderingContext2D, top: number, items: Array<{ label: string; value: string; hint: string }>) {
  const gap = 18;
  const colWidth = (PDF_CONTENT_WIDTH - gap) / 2;
  const rowHeight = 132;

  items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = PDF_CONTENT_LEFT + col * (colWidth + gap);
    const y = top + row * (rowHeight + gap);
    drawRoundedRect(ctx, x, y, colWidth, rowHeight, 14, "#FFFFFF", PDF_THEME.line);
    ctx.fillStyle = index % 2 === 0 ? PDF_THEME.accent : "#C59C6A";
    ctx.fillRect(x, y, colWidth, 6);
    drawText(ctx, item.label, x + 24, y + 28, {
      font: "500 15px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.muted,
    });

    const valueLines = getClippedWrappedLines(ctx, item.value, colWidth - 48, "700 22px 'Microsoft YaHei', sans-serif", 2);
    drawWrappedLines(ctx, valueLines, x + 24, y + 56, {
      font: "700 22px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.ink,
      lineHeight: 24,
    });

    const hintY = y + 56 + valueLines.length * 24 + 10;
    drawText(ctx, item.hint, x + 24, hintY, {
      font: "400 15px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.muted,
    });
  });

  return rowHeight * 2 + gap;
}

function estimateProblemTypeTableHeight(rowCount: number) {
  return 70 + Math.max(1, rowCount) * 44 + 16;
}

function drawProblemTypesTable(ctx: CanvasRenderingContext2D, top: number, items: AnalysisReportData["problemTypes"]) {
  const height = estimateProblemTypeTableHeight(items.length);
  const x = PDF_CONTENT_LEFT;
  const width = PDF_CONTENT_WIDTH;
  const rows = items.length > 0 ? items : [{ name: "暂无问题类型分布数据", count: 0, percent: 0 }];

  drawRoundedRect(ctx, x, top, width, height, 14, "#FFFFFF", PDF_THEME.line);
  ctx.fillStyle = PDF_THEME.panelStrong;
  ctx.fillRect(x, top, width, 52);
  drawText(ctx, "异常类型", x + 24, top + 16, {
    font: "600 15px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.ink,
  });
  drawText(ctx, "数量", x + width - 250, top + 16, {
    font: "600 15px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.ink,
  });
  drawText(ctx, "占比", x + width - 120, top + 16, {
    font: "600 15px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.ink,
  });

  rows.forEach((item, index) => {
    const rowY = top + 52 + index * 44;
    if (index > 0) {
      drawLine(ctx, x + 20, rowY, x + width - 20, rowY, "#EEE5D8", 1);
    }
    drawText(ctx, item.name, x + 24, rowY + 12, {
      font: "400 17px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.ink,
    });
    drawText(ctx, String(item.count), x + width - 238, rowY + 12, {
      font: "500 17px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.ink,
    });
    drawText(ctx, `${item.percent}%`, x + width - 108, rowY + 12, {
      font: "500 17px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.muted,
    });
  });
}

function drawRiskSummary(ctx: CanvasRenderingContext2D, top: number, totalRisk: number, riskItems: Array<{ label: string; count: number; color: string }>) {
  drawRoundedRect(ctx, PDF_CONTENT_LEFT, top, PDF_CONTENT_WIDTH, 176, 14, "#FFFFFF", PDF_THEME.line);
  drawText(ctx, "风险等级占比", PDF_CONTENT_LEFT + 24, top + 20, {
    font: "600 17px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.ink,
  });

  const barX = PDF_CONTENT_LEFT + 24;
  const barY = top + 58;
  const barWidth = PDF_CONTENT_WIDTH - 48;
  const barHeight = 20;
  drawRoundedRect(ctx, barX, barY, barWidth, barHeight, 10, "#F0E6D8");

  let currentX = barX;
  riskItems.forEach((item) => {
    const ratio = totalRisk > 0 ? item.count / totalRisk : 0;
    const segmentWidth = Math.max(0, barWidth * ratio);
    if (segmentWidth <= 0) {
      return;
    }
    ctx.fillStyle = item.color;
    ctx.fillRect(currentX, barY, segmentWidth, barHeight);
    currentX += segmentWidth;
  });

  riskItems.forEach((item, index) => {
    const percent = totalRisk > 0 ? Math.round((item.count / totalRisk) * 100) : 0;
    const rowY = top + 100 + index * 22;
    ctx.fillStyle = item.color;
    ctx.fillRect(PDF_CONTENT_LEFT + 24, rowY + 4, 12, 12);
    drawText(ctx, item.label, PDF_CONTENT_LEFT + 46, rowY, {
      font: "500 16px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.ink,
    });
    drawText(ctx, `${item.count} 项`, PDF_CONTENT_LEFT + 190, rowY, {
      font: "400 16px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.muted,
    });
    drawText(ctx, `${percent}%`, PDF_CONTENT_LEFT + PDF_CONTENT_WIDTH - 24, rowY, {
      font: "500 16px 'Microsoft YaHei', sans-serif",
      color: PDF_THEME.muted,
      align: "right",
    });
  });
}

function estimateNarrativeBlockHeight(ctx: CanvasRenderingContext2D, text: string, width: number, font: string, lineHeight: number, verticalPadding: number) {
  return estimateWrappedTextHeight(ctx, text, width, font, lineHeight) + verticalPadding * 2;
}

function drawNarrativeBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  options: { fill: string; stripe: string },
) {
  drawRoundedRect(ctx, x, y, width, height, 14, options.fill, PDF_THEME.line);
  ctx.fillStyle = options.stripe;
  ctx.fillRect(x, y, 10, height);
  const lines = wrapCanvasText(ctx, text, width - 60, "400 20px 'Microsoft YaHei', sans-serif");
  drawWrappedLines(ctx, lines, x + 28, y + 28, {
    font: "400 20px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.ink,
    lineHeight: 30,
  });
}

function estimateDetailCardHeight(ctx: CanvasRenderingContext2D, item: AnalysisReportData["detailRows"][number]) {
  const innerWidth = PDF_CONTENT_WIDTH - 48;
  const blockWidth = innerWidth - 32;
  const causeHeight = estimateLabeledBlockHeight(ctx, item.cause, blockWidth, "400 18px 'Microsoft YaHei', sans-serif", 28, 22, 84);
  const suggestionHeight = estimateLabeledBlockHeight(ctx, item.suggestion, blockWidth, "400 18px 'Microsoft YaHei', sans-serif", 28, 22, 84);
  const snippetLines = getClippedWrappedLines(ctx, item.snippet || "暂无日志片段", blockWidth, "400 16px 'Consolas', monospace", 8);
  const snippetHeight = Math.max(92, snippetLines.length * 22 + 48);
  return 104 + causeHeight + 14 + suggestionHeight + 14 + snippetHeight + 26;
}

function drawDetailCard(ctx: CanvasRenderingContext2D, top: number, item: AnalysisReportData["detailRows"][number]) {
  const height = estimateDetailCardHeight(ctx, item);
  drawRoundedRect(ctx, PDF_CONTENT_LEFT, top, PDF_CONTENT_WIDTH, height, 14, "#FFFFFF", PDF_THEME.line);
  drawText(ctx, item.type, PDF_CONTENT_LEFT + 24, top + 22, {
    font: "700 24px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.ink,
  });
  drawBadge(ctx, PDF_CONTENT_LEFT + PDF_CONTENT_WIDTH - 142, top + 20, 118, 32, item.riskLabel, riskBadgeColors(item.riskLabel));
  drawText(ctx, `事件 ID ${item.incidentId} · 行号 ${item.lineNumber} · 置信度 ${Math.round(item.confidence * 100)}%`, PDF_CONTENT_LEFT + 24, top + 56, {
    font: "400 15px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.muted,
  });
  drawLine(ctx, PDF_CONTENT_LEFT + 24, top + 84, PDF_CONTENT_LEFT + PDF_CONTENT_WIDTH - 24, top + 84, "#EEE5D8", 1);

  const innerX = PDF_CONTENT_LEFT + 24;
  const blockWidth = PDF_CONTENT_WIDTH - 48;
  let cursor = top + 98;
  const causeHeight = drawLabeledBlock(ctx, innerX, cursor, blockWidth, "根因判断", item.cause, {
    labelColor: PDF_THEME.muted,
    panelFill: "#FBF8F3",
    bodyColor: PDF_THEME.ink,
  });
  cursor += causeHeight + 14;
  const suggestionHeight = drawLabeledBlock(ctx, innerX, cursor, blockWidth, "处理建议", item.suggestion, {
    labelColor: PDF_THEME.accent,
    panelFill: "#FCF7EE",
    bodyColor: PDF_THEME.ink,
  });
  cursor += suggestionHeight + 14;

  const snippetLines = getClippedWrappedLines(ctx, item.snippet || "暂无日志片段", blockWidth - 32, "400 16px 'Consolas', monospace", 8);
  const snippetHeight = Math.max(92, snippetLines.length * 22 + 48);
  drawRoundedRect(ctx, innerX, cursor, blockWidth, snippetHeight, 12, "#F4F1EC", "#D9D0C3");
  drawText(ctx, "日志片段", innerX + 16, cursor + 16, {
    font: "600 15px 'Microsoft YaHei', sans-serif",
    color: PDF_THEME.muted,
  });
  drawWrappedLines(ctx, snippetLines, innerX + 16, cursor + 42, {
    font: "400 16px 'Consolas', monospace",
    color: "#3A3530",
    lineHeight: 22,
  });
}

function drawLabeledBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  text: string,
  options: { labelColor: string; panelFill: string; bodyColor: string },
) {
  const height = estimateLabeledBlockHeight(ctx, text, width - 32, "400 18px 'Microsoft YaHei', sans-serif", 28, 22, 84);
  drawRoundedRect(ctx, x, y, width, height, 12, options.panelFill, "#E6DACC");
  drawText(ctx, label, x + 16, y + 14, {
    font: "600 15px 'Microsoft YaHei', sans-serif",
    color: options.labelColor,
  });
  const lines = wrapCanvasText(ctx, text, width - 32, "400 18px 'Microsoft YaHei', sans-serif");
  drawWrappedLines(ctx, lines, x + 16, y + 40, {
    font: "400 18px 'Microsoft YaHei', sans-serif",
    color: options.bodyColor,
    lineHeight: 28,
  });
  return height;
}

function estimateLabeledBlockHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  font: string,
  lineHeight: number,
  verticalPadding: number,
  minHeight: number,
) {
  return Math.max(minHeight, estimateWrappedTextHeight(ctx, text, width, font, lineHeight) + verticalPadding * 2);
}

function estimateWrappedTextHeight(ctx: CanvasRenderingContext2D, text: string, width: number, font: string, lineHeight: number) {
  return wrapCanvasText(ctx, text, width, font).length * lineHeight;
}

function getClippedWrappedLines(ctx: CanvasRenderingContext2D, text: string, width: number, font: string, maxLines: number) {
  const lines = wrapCanvasText(ctx, text, width, font);
  if (lines.length <= maxLines) {
    return lines;
  }

  const clipped = lines.slice(0, maxLines);
  const lastLine = clipped[maxLines - 1] || "";
  clipped[maxLines - 1] = `${lastLine.slice(0, Math.max(0, lastLine.length - 1))}…`;
  return clipped;
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string) {
  ctx.save();
  ctx.font = font;

  const paragraphs = String(text || "").split(/\n/);
  const lines: string[] = [];

  paragraphs.forEach((paragraph) => {
    const content = paragraph || " ";
    let current = "";

    for (const char of Array.from(content)) {
      const next = current + char;
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = next;
      }
    }

    lines.push(current || " ");
  });

  ctx.restore();
  return normalizeWrappedLines(lines);
}

function normalizeWrappedLines(lines: string[]) {
  if (lines.length <= 1) {
    return lines;
  }

  const punctuation = new Set(["，", "。", "、", "；", "：", "！", "？", "）", "】", "》", ",", ".", ";", ":", "!", "?", ")", "]"]);
  const normalized = [...lines];

  for (let index = 1; index < normalized.length; index += 1) {
    const current = normalized[index];
    if (!current) {
      continue;
    }

    const first = Array.from(current)[0];
    if (!punctuation.has(first)) {
      continue;
    }

    normalized[index - 1] += first;
    normalized[index] = current.slice(first.length).trimStart() || " ";
  }

  return normalized;
}

function drawWrappedLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  options: { font: string; color: string; lineHeight: number },
) {
  ctx.save();
  ctx.font = options.font;
  ctx.fillStyle = options.color;
  ctx.textBaseline = "top";
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * options.lineHeight);
  });
  ctx.restore();
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: { font: string; color: string; align?: CanvasTextAlign },
) {
  ctx.save();
  ctx.font = options.font;
  ctx.fillStyle = options.color;
  ctx.textAlign = options.align ?? "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 1,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawInfoPanel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fill: string) {
  drawRoundedRect(ctx, x, y, width, height, 12, fill, PDF_THEME.line);
}

function drawBadgeRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  badges: Array<{ label: string; fill: string; text: string; border: string }>,
) {
  let cursorX = x;
  badges.forEach((badge) => {
    const width = Math.max(110, measureBadgeWidth(ctx, badge.label));
    drawBadge(ctx, cursorX, y, width, 34, badge.label, badge);
    cursorX += width + 14;
  });
}

function measureBadgeWidth(ctx: CanvasRenderingContext2D, text: string) {
  ctx.save();
  ctx.font = "600 15px 'Microsoft YaHei', sans-serif";
  const width = ctx.measureText(text).width + 30;
  ctx.restore();
  return width;
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  colors: { fill: string; text: string; border: string },
) {
  drawRoundedRect(ctx, x, y, width, height, height / 2, colors.fill, colors.border);
  drawText(ctx, text, x + width / 2, y + 7, {
    font: "600 15px 'Microsoft YaHei', sans-serif",
    color: colors.text,
    align: "center",
  });
}

function riskBadgeColors(riskLabel: string) {
  if (riskLabel === "高风险") {
    return RISK_VISUALS.高风险;
  }
  if (riskLabel === "中风险") {
    return RISK_VISUALS.中风险;
  }
  if (riskLabel === "低风险") {
    return RISK_VISUALS.低风险;
  }
  return RISK_VISUALS.默认;
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function sanitizeFileName(value: string) {
  return String(value || "analysis-report").replace(/[\\/:*?"<>|]/g, "-");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
