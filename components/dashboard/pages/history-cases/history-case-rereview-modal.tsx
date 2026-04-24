"use client";

import type { ReviewCaseRevisionSummary } from "@/lib/dashboard/review-case-revisions";

export type HistoryCaseRereviewCaseMeta = {
  id: string;
  incidentId: string;
  title: string;
  sourceLog: string;
  updatedAt: string;
};

export type HistoryCaseRereviewDraft = {
  finalErrorType: string;
  finalRiskLevel: string;
  reviewNote: string;
};

type HistoryCaseRereviewModalProps = {
  open: boolean;
  caseMeta: HistoryCaseRereviewCaseMeta | null;
  draft: HistoryCaseRereviewDraft;
  revisions: ReviewCaseRevisionSummary[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  onChange: (patch: Partial<HistoryCaseRereviewDraft>) => void;
  onClose: () => void;
  onSave: () => void;
};

const RISK_OPTIONS = [
  { value: "high", label: "高风险" },
  { value: "medium", label: "中风险" },
  { value: "low", label: "低风险" },
];

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRevisionText(revision: ReviewCaseRevisionSummary) {
  const parts = [
    `异常类型：${formatValue(revision.beforeSnapshot.finalErrorType)} -> ${formatValue(revision.afterSnapshot.finalErrorType)}`,
    `风险等级：${formatRiskValue(revision.beforeSnapshot.finalRiskLevel)} -> ${formatRiskValue(revision.afterSnapshot.finalRiskLevel)}`,
  ];
  parts.push(revision.noteChanged ? "复盘说明已更新" : "复盘说明未变化");
  return parts.join(" / ");
}

function formatValue(value: string | null) {
  return value || "未设置";
}

function formatRiskValue(value: string | null) {
  if (value === "high") return "高风险";
  if (value === "medium") return "中风险";
  if (value === "low") return "低风险";
  return formatValue(value);
}

export function HistoryCaseRereviewModal({
  open,
  caseMeta,
  draft,
  revisions,
  loading,
  saving,
  error,
  onChange,
  onClose,
  onSave,
}: HistoryCaseRereviewModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#0E1B2A]/45 px-4 py-8 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_24px_60px_rgba(15,31,52,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#DCE4EE] px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1F4E79]">edit_note</span>
              <h3 className="text-lg font-bold text-[#1F2A37]">重新复盘</h3>
            </div>
            <p className="mt-1 text-xs leading-6 text-[#7B8898]">修改已复盘案例的人工判断，并保留本次修改轨迹。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[#CBD7E4] bg-white px-3 py-2 text-xs font-medium text-[#5F6B7A] transition hover:bg-[#F3F7FC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            关闭
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-[#CBD7E4] bg-[#F8FAFD] px-5 py-10 text-center text-sm text-[#5F6B7A]">
              正在加载复盘记录...
            </div>
          ) : (
            <div className="space-y-5">
              {caseMeta ? (
                <div className="grid gap-3 rounded-2xl border border-[#DCE4EE] bg-[#F8FAFD] p-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">问题名称</p>
                    <p className="mt-1 font-medium text-[#1F2A37]">{caseMeta.title}</p>
                  </div>
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">来源日志</p>
                    <p className="mt-1 text-[#314254]">{caseMeta.sourceLog || "-"}</p>
                  </div>
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">最近复盘时间</p>
                    <p className="mt-1 text-[#314254]">{formatDateTime(caseMeta.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">事件 ID</p>
                    <p className="mt-1 break-all font-label text-[11px] text-[#5F6B7A]">{caseMeta.incidentId || "-"}</p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-label uppercase tracking-wider text-[#5F6B7A]">异常类型</span>
                  <input
                    value={draft.finalErrorType}
                    onChange={(event) => onChange({ finalErrorType: event.target.value })}
                    disabled={saving}
                    className="w-full rounded-xl border border-[#CBD7E4] bg-[#F8FAFD] px-4 py-3 text-sm text-[#1F2A37] outline-none transition placeholder:text-[#97A4B2] focus:border-[#1F4E79]/45 disabled:cursor-not-allowed disabled:opacity-70"
                    placeholder="例如：database_timeout"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-label uppercase tracking-wider text-[#5F6B7A]">风险等级</span>
                  <select
                    value={draft.finalRiskLevel}
                    onChange={(event) => onChange({ finalRiskLevel: event.target.value })}
                    disabled={saving}
                    className="w-full rounded-xl border border-[#CBD7E4] bg-[#F8FAFD] px-4 py-3 text-sm text-[#1F2A37] outline-none transition focus:border-[#1F4E79]/45 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {RISK_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-xs font-label uppercase tracking-wider text-[#5F6B7A]">复盘说明</span>
                <textarea
                  value={draft.reviewNote}
                  onChange={(event) => onChange({ reviewNote: event.target.value })}
                  disabled={saving}
                  rows={5}
                  className="w-full rounded-2xl border border-[#CBD7E4] bg-[#F8FAFD] p-4 text-sm leading-7 text-[#1F2A37] outline-none transition placeholder:text-[#97A4B2] focus:border-[#1F4E79]/45 disabled:cursor-not-allowed disabled:opacity-70"
                  placeholder="记录本次人工修正依据、处置方案或后续沉淀建议。"
                />
              </label>

              <div className="rounded-2xl border border-[#DCE4EE] bg-[#F8FAFD] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#1F4E79]">history</span>
                  <p className="text-sm font-bold text-[#1F2A37]">最近修改轨迹</p>
                </div>
                {revisions.length === 0 ? (
                  <p className="text-xs leading-6 text-[#7B8898]">暂无修改轨迹，保存后会记录本次重新复盘。</p>
                ) : (
                  <div className="space-y-3">
                    {revisions.map((revision) => (
                      <div key={`${revision.createdAt}-${revision.typeChangeText}-${revision.riskChangeText}`} className="rounded-xl border border-[#DCE4EE] bg-white px-4 py-3">
                        <p className="text-xs font-medium text-[#1F2A37]">{formatDateTime(revision.createdAt)}</p>
                        <p className="mt-1 text-xs leading-6 text-[#5F6B7A]">{formatRevisionText(revision)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error ? (
                <div className="rounded-xl border border-[#F1B8B8] bg-[#FFF2F0] px-4 py-3 text-sm text-[#B45151]">
                  {error}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#DCE4EE] bg-[#F8FAFD] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[#CBD7E4] bg-white px-4 py-2 text-sm text-[#5F6B7A] transition hover:bg-[#F3F7FC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading || saving || !caseMeta}
            className="rounded-lg bg-[#1F4E79] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#173D61] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "保存中..." : "保存修改"}
          </button>
        </div>
      </div>
    </div>
  );
}
