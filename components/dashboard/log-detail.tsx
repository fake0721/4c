import Link from "next/link";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";

type LogDetailProps = {
  log: {
    id: string;
    fileName: string;
    fileType: string;
    sourceType: string;
    analysisMode: string;
    status: string;
    storagePath: string;
    fileSize: number;
    lineCount: number;
    uploadedAt: string;
    completedAt: string | null;
  };
  errors: {
    id: string;
    rawText: string;
    errorType: string;
    detectedBy: string;
    lineNumber: number;
    createdAt: string;
  }[];
  analyses: {
    id: string;
    logErrorId: string | null;
    cause: string;
    riskLevel: string;
    confidence: number;
    repairSuggestion: string;
    modelName: string;
    analysisMode: string;
    createdAt: string;
  }[];
  preview: {
    text: string;
    truncated: boolean;
  } | null;
};

export function LogDetail({ log, errors, analyses, preview }: LogDetailProps) {
  const analysisByErrorId = new Map(
    analyses
      .filter((analysis) => analysis.logErrorId)
      .map((analysis) => [analysis.logErrorId as string, analysis]),
  );
  const uncertainCount = analyses.filter((analysis) => analysis.riskLevel === "uncertain").length;

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard
          eyebrow="Log Detail"
          title="当前日志详细内容"
          description="这里是这次日志任务的完整结果页。上传分析成功后，系统会直接落到这里查看当前文件的分析内容。"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <InfoBlock label="任务状态" value={getStatusLabel(log.status)}>
              <StatusPill label={getStatusLabel(log.status)} tone={getStatusTone(log.status)} />
            </InfoBlock>
            <InfoBlock label="分析方式" value={log.analysisMode}>
              <StatusPill label={log.analysisMode} tone="info" />
            </InfoBlock>
            <InfoBlock label="Source Type" value={formatSource(log.sourceType)} />
            <InfoBlock label="文件类型" value={log.fileType || "未知"} />
            <InfoBlock label="文件大小" value={formatBytes(log.fileSize)} />
            <InfoBlock label="总行数" value={`${log.lineCount} 行`} />
            <InfoBlock label="上传时间" value={formatTimestamp(log.uploadedAt)} />
            <InfoBlock label="完成时间" value={log.completedAt ? formatTimestamp(log.completedAt) : "尚未完成"} />
          </div>

          <div className="mt-5 rounded-3xl border border-white/8 bg-slate-950/35 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Storage Path</p>
            <p className="mt-2 break-all font-mono text-sm text-cyan-200">{log.storagePath || "无"}</p>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Actions"
          title="结果查看与人工复查"
          description="如果系统已经给出明确结果，就直接看分析内容；如果存在不确定项或需要人工确认，可以从这里进入审核与规则管理。"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard label="异常命中" value={`${errors.length}`} />
            <SummaryCard label="分析结果" value={`${analyses.length}`} />
            <SummaryCard label="待确认" value={`${uncertainCount}`} />
          </div>

          <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/8 p-4">
            <p className="text-sm font-semibold text-white">查看路径</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/dashboard/tasks"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                返回数据管理中心
              </Link>
              <Link
                href={`/dashboard/reviews?logId=${encodeURIComponent(log.id)}`}
                className="rounded-full border border-amber-300/25 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-amber-300/60 hover:bg-white/6"
              >
                前往审核与规则管理
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/8 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">人工复查入口</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              当系统无法断定、结果置信度偏低，或者你希望人工确认处理方式时，从这里进入审核与规则管理页面完成复查。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <StatusPill label={uncertainCount > 0 ? `待确认 ${uncertainCount} 条` : "可人工复查"} tone={uncertainCount > 0 ? "warning" : "info"} />
              <StatusPill label={analyses.some((item) => item.riskLevel === "high") ? "包含高风险结果" : "普通结果"} tone={analyses.some((item) => item.riskLevel === "high") ? "danger" : "success"} />
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          eyebrow="Incidents"
          title="异常命中明细"
          description="这里逐条展示规则层命中的异常片段，并串起对应的结构化分析结果。"
        >
          <div className="space-y-3">
            {errors.length === 0 ? (
              <EmptyState text="当前日志没有规则命中的异常记录。" />
            ) : (
              errors.map((error) => {
                const analysis = analysisByErrorId.get(error.id);

                return (
                  <div key={error.id} className="rounded-3xl border border-white/8 bg-white/5 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill label={formatErrorType(error.errorType)} tone="warning" />
                          <StatusPill label={error.detectedBy} tone="info" />
                          <span className="text-xs text-slate-500">第 {error.lineNumber || "-"} 行</span>
                        </div>
                        <p className="font-mono text-sm leading-6 text-slate-200">{error.rawText}</p>
                        {analysis ? (
                          <div className="rounded-2xl bg-slate-950/40 px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill label={getRiskLabel(analysis.riskLevel)} tone={getRiskTone(analysis.riskLevel)} />
                              <span className="text-xs text-slate-500">置信度 {formatConfidence(analysis.confidence)}</span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-white">{analysis.cause}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">{analysis.repairSuggestion}</p>
                          </div>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500">{formatTimestamp(error.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Preview"
          title="原始日志预览"
          description="这里只展示前 40 行内容，用来快速核对上下文。体积过大的文件不会整页展开。"
        >
          {preview ? (
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <pre className="max-h-[720px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-300">
                {preview.text}
              </pre>
              {preview.truncated ? (
                <p className="mt-4 text-xs text-slate-500">这里只展示前 40 行预览，完整原始日志仍保存在 Storage 中。</p>
              ) : null}
            </div>
          ) : (
            <EmptyState text="当前日志没有可展示的原始预览，可能是文件过大或读取失败。" />
          )}
        </SectionCard>
      </section>

      <SectionCard
        eyebrow="Analysis"
        title="分析结果列表"
        description="这里展示当前日志的全部结构化分析结果，包括原因判断、风险等级和处理建议。"
      >
        <div className="space-y-3">
          {analyses.length === 0 ? (
            <EmptyState text="当前日志还没有分析结果。" />
          ) : (
            analyses.map((analysis) => (
              <div key={analysis.id} className="rounded-3xl border border-white/8 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill label={getRiskLabel(analysis.riskLevel)} tone={getRiskTone(analysis.riskLevel)} />
                      <StatusPill label={analysis.analysisMode} tone="info" />
                      <StatusPill label={analysis.modelName} tone="neutral" />
                    </div>
                    <p className="text-sm leading-6 text-white">{analysis.cause}</p>
                    <p className="text-sm leading-6 text-slate-300">{analysis.repairSuggestion}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Confidence</p>
                    <p className="mt-1 text-lg font-semibold text-cyan-200">{formatConfidence(analysis.confidence)}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatTimestamp(analysis.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </>
  );
}

function InfoBlock({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function formatBytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatTimestamp(value: string) {
  if (!value) return "暂无时间";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatConfidence(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0.00";
  return value.toFixed(2);
}

function getRiskTone(riskLevel: string) {
  if (riskLevel === "high") return "danger";
  if (riskLevel === "low") return "success";
  if (riskLevel === "uncertain") return "warning";
  return "warning";
}

function getRiskLabel(riskLevel: string) {
  if (riskLevel === "high") return "高风险";
  if (riskLevel === "low") return "低风险";
  if (riskLevel === "uncertain") return "待确认";
  return "中风险";
}

function getStatusTone(status: string) {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";
  if (status === "processing") return "warning";
  return "info";
}

function getStatusLabel(status: string) {
  if (status === "completed") return "已完成";
  if (status === "failed") return "失败";
  if (status === "processing") return "处理中";
  return "已上传";
}

function formatSource(value: string) {
  if (value === "nginx") return "Nginx";
  if (value === "system") return "System";
  if (value === "PostgreSQL") return "PostgreSQL";
  if (value === "application") return "Application";
  return "Custom";
}

function formatErrorType(value: string) {
  return toIssueTypeDisplayName(value);
}
