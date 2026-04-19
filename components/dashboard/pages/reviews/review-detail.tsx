import { useEffect, useRef } from "react";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";
import { ReviewHistoryCases } from "@/components/dashboard/pages/reviews/review-history-cases";
import type { ReviewItem } from "@/lib/dashboard/reviews";

type ReviewDetailProps = {
  item: ReviewItem | null;
  historyCases: ReviewItem[];
  queueLength: number;
  onSelectHistoryCase: (id: string) => void;
  onConfirmNext: () => void;
  isSubmitting: boolean;
  issueTypeValue: string;
  riskValue: string;
  reviewNote: string;
  onIssueTypeChange: (value: string) => void;
  onRiskChange: (value: string) => void;
  onReviewNoteChange: (value: string) => void;
};

const DEFAULT_ISSUE_TYPE_OPTIONS = [
  "确认：系统资源瓶颈",
  "确认：业务代码逻辑错误",
  "误报：常规维护操作",
  "其他原因",
];

const RISK_OPTIONS = [
  { value: "high", label: "高风险 (Critical)" },
  { value: "medium", label: "中风险 (Moderate)" },
  { value: "low", label: "低风险 (Low)" },
];

function riskBadgeClass(riskLabel: string) {
  if (riskLabel.includes("高")) return "bg-[#B45151] text-white";
  if (riskLabel.includes("低")) return "bg-[#2F6A9A] text-white";
  return "bg-[#3A6A9A] text-white";
}

function confidencePercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function confidenceStroke(value: number) {
  const bounded = Math.max(0, Math.min(1, value));
  const circumference = 251.2;
  return circumference - circumference * bounded;
}

function normalizeSnippet(value: string | null | undefined) {
  const raw = String(value ?? "");

  // Remove ANSI escape sequences and invisible control chars that can render as a blank block.
  const cleaned = raw
    .replace(/\x1b\[[0-9;]*m/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n");

  return cleaned.trim().length > 0
    ? cleaned
    : "暂无日志片段（原始内容为空或仅包含不可见字符）";
}

function buildIssueTypeOptions(currentValue: string) {
  return Array.from(new Set([currentValue, ...DEFAULT_ISSUE_TYPE_OPTIONS].filter(Boolean))).map((value) => ({
    value,
    label: value.startsWith("确认：") || value.startsWith("误报：") ? value : `确认：${toIssueTypeDisplayName(value)}`,
  }));
}

export function ReviewDetail({
  item,
  historyCases,
  queueLength,
  onSelectHistoryCase,
  onConfirmNext,
  isSubmitting,
  issueTypeValue,
  riskValue,
  reviewNote,
  onIssueTypeChange,
  onRiskChange,
  onReviewNoteChange,
}: ReviewDetailProps) {
  const detailScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = detailScrollRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({ top: 0, behavior: "smooth" });
  }, [item?.id]);

  if (!item) {
    return (
      <div ref={detailScrollRef} className="flex flex-1 flex-col overflow-y-auto bg-[#F3F5F8]">
        <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center p-8 text-[#5F6B7A]">
          当前没有待复核问题
        </div>
      </div>
    );
  }

  const isPendingItem = item.reviewStatus === "pending";
  const issueTypeOptions = buildIssueTypeOptions(issueTypeValue || item.issueTypeValue);
  const snippetText = normalizeSnippet(item.snippet);

  return (
    <div ref={detailScrollRef} className="flex flex-1 flex-col overflow-y-auto bg-[#F3F5F8]">
      <div className="mx-auto w-full max-w-5xl space-y-8 p-8 pb-40 md:pb-32">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-bold shadow-[0_0_12px_rgba(31,78,121,0.2)] ${riskBadgeClass(item.riskLabel)}`}>
              {item.riskLabel}
            </span>
            <span className="font-label text-xs uppercase tracking-widest text-[#7B8898]">Event ID: {item.incidentId}</span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold leading-tight tracking-tight text-[#1F2A37]">{item.title}</h1>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-label text-xs uppercase tracking-widest text-[#5F6B7A]">原始日志片段</h3>
          </div>
          <div
            className="overflow-x-auto rounded-2xl border border-[#CBD7E4] bg-[#F8FAFD] p-6 font-mono text-sm leading-relaxed shadow-[0_10px_24px_rgba(31,42,55,0.08)]"
            style={{ color: "#1f2a37" }}
          >
            <p className="mb-3 text-xs text-[#7B8898]">日志行：102</p>
            <pre className="m-0 whitespace-pre-wrap break-words" style={{ color: "#1f2a37" }}>
              {snippetText}
            </pre>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-[#DCE4EE] bg-[#FFFFFF] p-6 shadow-[0_8px_20px_rgba(31,59,53,0.05)] md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1F4E79]">psychology</span>
              <h3 className="text-sm font-bold text-[#1F2A37]">AI 分析结论 (Insight)</h3>
            </div>
            <div>
              <p className="mb-1 font-label text-xs uppercase tracking-tighter text-[#7B8898]">根因定位</p>
              <p className="text-sm leading-relaxed text-[#314254]">{item.cause}</p>
            </div>
            <div>
              <p className="mb-1 font-label text-xs uppercase tracking-tighter text-[#7B8898]">建议策略</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-[#314254]">
                <li>{item.suggestion}</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-2 rounded-2xl border border-[#DCE4EE] bg-[#FFFFFF] p-6 text-center shadow-[0_8px_20px_rgba(31,59,53,0.05)]">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg className="h-full w-full -rotate-90">
                <circle className="text-[#DCE4EE]" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                <circle
                  className="text-[#1F4E79]"
                  cx="48"
                  cy="48"
                  fill="transparent"
                  r="40"
                  stroke="currentColor"
                  strokeDasharray="251.2"
                  strokeDashoffset={confidenceStroke(item.confidence)}
                  strokeWidth="8"
                ></circle>
              </svg>
              <span className="absolute font-headline text-2xl font-bold text-[#1F2A37]">{confidencePercent(item.confidence)}</span>
            </div>
            <p className="text-sm font-bold text-[#1F2A37]">AI 置信度</p>
            <p className="text-[10px] text-[#7B8898]">{isPendingItem ? `当前待复核队列共 ${queueLength} 条问题` : "当前为历史复核案例"}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-[#DCE4EE] bg-[#FFFFFF] p-6 shadow-[0_8px_20px_rgba(31,59,53,0.05)]">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1F4E79]">edit_note</span>
            <div>
              <h3 className="text-lg font-bold text-[#1F2A37]">人工复核确认表单</h3>
              <p className="mt-1 text-xs text-[#7B8898]">补充人工处理方法、知识沉淀要点或后续执行步骤。</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-label uppercase tracking-wider text-[#5F6B7A]">人工判定原因</label>
              <select
                value={issueTypeValue}
                onChange={(event) => onIssueTypeChange(event.target.value)}
                disabled={!isPendingItem}
                className="w-full rounded-xl border border-[#CBD7E4] bg-[#F8FAFD] px-4 py-3 text-sm text-[#1F2A37] outline-none transition focus:border-[#1F4E79]/45 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {issueTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-label uppercase tracking-wider text-[#5F6B7A]">风险确认级别</label>
              <select
                value={riskValue}
                onChange={(event) => onRiskChange(event.target.value)}
                disabled={!isPendingItem}
                className="w-full rounded-xl border border-[#CBD7E4] bg-[#F8FAFD] px-4 py-3 text-sm text-[#1F2A37] outline-none transition focus:border-[#1F4E79]/45 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {RISK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-xs font-label uppercase tracking-wider text-[#5F6B7A]">复核说明 / 处置方案</label>
            <textarea
              value={reviewNote}
              onChange={(event) => onReviewNoteChange(event.target.value)}
              disabled={!isPendingItem}
              rows={4}
              placeholder="请输入详细的人工复核意见或待执行的紧急处置步骤..."
              className="w-full rounded-2xl border border-[#CBD7E4] bg-[#F8FAFD] p-4 text-sm leading-7 text-[#1F2A37] outline-none transition placeholder:text-[#97A4B2] focus:border-[#1F4E79]/45 disabled:cursor-not-allowed disabled:opacity-70"
            />
            {!isPendingItem ? (
              <p className="mt-3 text-xs text-[#7B8898]">历史案例当前仅供查看，不再编辑复核说明。</p>
            ) : null}
          </div>
        </div>

        <ReviewHistoryCases rows={historyCases} onSelect={onSelectHistoryCase} />
      </div>

      <footer className="glass-panel fixed bottom-0 left-0 right-0 z-40 flex min-h-20 flex-col gap-4 border-t border-[#CBD7E4] bg-[#FFFFFF]/92 px-4 py-4 backdrop-blur-xl md:left-64 md:h-20 md:flex-row md:items-center md:justify-end md:px-8 md:py-0">
        {isPendingItem ? (
          <button
            className="rounded-xl bg-[#1F4E79] px-10 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(31,78,121,0.28)] transition-all hover:shadow-[0_0_36px_rgba(31,78,121,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onConfirmNext}
            disabled={queueLength === 0 || isSubmitting}
          >
            {isSubmitting ? "确认中..." : "确认并下一条"}
          </button>
        ) : (
          <div className="rounded-xl border border-[#CBD7E4] bg-[#F8FAFD] px-5 py-3 text-sm text-[#5F6B7A]">
            历史案例仅供查看
          </div>
        )}
      </footer>
    </div>
  );
}
