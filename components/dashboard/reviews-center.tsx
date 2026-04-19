import Link from "next/link";
import { submitReviewCaseAction } from "@/app/reviews/actions";
import { createDetectionRuleAction } from "@/app/rules/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";

type ReviewItem = {
  id: string;
  logId: string;
  logName: string;
  rawText: string;
  errorType: string;
  detectedBy: string;
  lineNumber: number;
  createdAt: string;
  reviewStatus: string;
  issueSpot: string;
  resolution: string;
  updatedAt: string | null;
};

type LogGroup = {
  logId: string;
  logName: string;
  total: number;
  pending: number;
  completed: number;
  latestAt: string;
};

type ReviewsCenterProps = {
  status?: string;
  message?: string;
  filterLogId?: string;
  currentLogName?: string | null;
  logGroups: LogGroup[];
  items: ReviewItem[];
  ruleSummary: {
    total: number;
    enabled: number;
    recentRules: {
      id: string;
      name: string;
      errorType: string;
      riskLevel: string;
      updatedAt: string;
    }[];
  };
};

export function ReviewsCenter({
  status,
  message,
  filterLogId,
  currentLogName,
  logGroups,
  items,
  ruleSummary,
}: ReviewsCenterProps) {
  const pendingCount = items.filter(
    (item) => item.reviewStatus !== "completed" && item.reviewStatus !== "skipped",
  ).length;
  const completedCount = items.filter((item) => item.reviewStatus === "completed").length;
  const returnPath = filterLogId
    ? `/dashboard/reviews?logId=${encodeURIComponent(filterLogId)}`
    : "/dashboard/reviews";

  return (
    <>
      {message ? (
        <section className="dashboard-panel rounded-[28px] border border-[#dce4ee] bg-white p-4 shadow-[0_14px_42px_rgba(31,42,55,0.1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#1f2a37]">审核与规则管理提示</p>
              <p className="mt-2 text-sm leading-6 text-[#5f6b7a]">{message}</p>
            </div>
            <StatusPill
              label={status === "success" ? "成功" : status === "error" ? "失败" : "提示"}
              tone={status === "error" ? "danger" : status === "success" ? "success" : "info"}
            />
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="待复核" value={`${pendingCount}`} tone="warning" />
        <SummaryCard label="已完成复核" value={`${completedCount}`} tone="success" />
        <SummaryCard label="已启用规则" value={`${ruleSummary.enabled}`} tone="info" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard eyebrow="Review" title={filterLogId ? `人工复查：${currentLogName ?? "当前日志"}` : "人工复查"}>
          {!filterLogId ? (
            <div className="space-y-4">
              {logGroups.length === 0 ? (
                <EmptyState text="当前没有需要人工复查的日志。" />
              ) : (
                logGroups.map((group) => (
                  <div key={group.logId} className="rounded-[28px] border border-[#dce4ee] bg-white p-5 transition hover:border-[#9db3cd] hover:shadow-[0_10px_26px_rgba(31,42,55,0.1)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-[#1f2a37]">{group.logName}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <StatusPill label={`异常 ${group.total}`} tone="info" />
                          <StatusPill label={`待复核 ${group.pending}`} tone="warning" />
                          <StatusPill label={`已完成 ${group.completed}`} tone="success" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/logs/${group.logId}`}
                          className="rounded-full border border-[#c4d2e3] bg-white px-4 py-2 text-sm font-medium text-[#314254] transition hover:border-[#8ea8c6] hover:bg-[#f4f8fc]"
                        >
                          查看日志详情
                        </Link>
                        <Link
                          href={`/dashboard/reviews?logId=${encodeURIComponent(group.logId)}`}
                          className="rounded-full bg-[#1f4e79] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#173d61]"
                        >
                          进入复查详情
                        </Link>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-[#7b8898]">最近异常时间：{formatTimestamp(group.latestAt)}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#dce4ee] bg-white px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-[#1f2a37]">当前日志</p>
                  <p className="mt-1 text-sm text-[#5f6b7a]">{currentLogName ?? "当前日志"}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/reviews"
                    className="rounded-full border border-[#c4d2e3] bg-white px-4 py-2 text-sm font-medium text-[#314254] transition hover:border-[#8ea8c6] hover:bg-[#f4f8fc]"
                  >
                    返回日志分组
                  </Link>
                  <Link
                    href={`/dashboard/logs/${filterLogId}`}
                    className="rounded-full bg-[#1f4e79] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#173d61]"
                  >
                    打开当前日志详细内容
                  </Link>
                </div>
              </div>

              {items.length === 0 ? (
                <EmptyState text="当前日志没有需要人工复查的异常。" />
              ) : (
                items.map((item) => (
                  <form
                    key={item.id}
                    action={submitReviewCaseAction}
                    className="rounded-[28px] border border-[#dce4ee] bg-white p-5 transition hover:border-[#9db3cd] hover:shadow-[0_10px_26px_rgba(31,42,55,0.1)]"
                  >
                    <input type="hidden" name="logErrorId" value={item.id} />
                    <input type="hidden" name="returnPath" value={returnPath} />

                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill label={formatErrorType(item.errorType)} tone="warning" />
                          <StatusPill label={getReviewLabel(item.reviewStatus)} tone={getReviewTone(item.reviewStatus)} />
                          <StatusPill label={item.detectedBy} tone="info" />
                        </div>
                        <p className="font-mono text-sm leading-6 text-[#314254]">{item.rawText}</p>
                        <p className="text-xs text-[#7b8898]">
                          第 {item.lineNumber || "-"} 行 | {formatTimestamp(item.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <label className="space-y-2">
                        <span className="block text-sm font-medium text-[#314254]">出错位置</span>
                        <textarea
                          name="issueSpot"
                          defaultValue={item.issueSpot}
                          rows={4}
                          placeholder="填写问题出现在什么服务、链路或模块。"
                          className="w-full rounded-3xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="block text-sm font-medium text-[#314254]">解决方法</span>
                        <textarea
                          name="resolution"
                          defaultValue={item.resolution}
                          rows={4}
                          placeholder="填写最终处理方式。"
                          className="w-full rounded-3xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-[#7b8898]">
                        {item.updatedAt ? `最近更新于 ${formatTimestamp(item.updatedAt)}` : "这条记录还没有人工复查结果。"}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          name="intent"
                          value="skip"
                          className="rounded-full border border-[#c4d2e3] bg-white px-4 py-2 text-sm font-medium text-[#314254] transition hover:border-[#8ea8c6] hover:bg-[#f4f8fc]"
                        >
                          跳过
                        </button>
                        <button
                          type="submit"
                          name="intent"
                          value="save"
                          className="rounded-full bg-[#1f4e79] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#173d61]"
                        >
                          保存复查
                        </button>
                      </div>
                    </div>
                  </form>
                ))
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard eyebrow="Rules" title="沉淀规则">
          <form action={createDetectionRuleAction} className="space-y-4 rounded-3xl border border-[#dce4ee] bg-white p-4">
            <input type="hidden" name="returnPath" value={returnPath} />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[#314254]">规则名称</span>
                <input
                  name="name"
                  type="text"
                  placeholder="例如：支付服务连接拒绝"
                  className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[#314254]">匹配类型</span>
                <select
                  name="matchType"
                  defaultValue="keyword"
                  className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9]"
                >
                  <option value="keyword">关键词</option>
                  <option value="regex">正则</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#314254]">匹配模式</span>
              <input
                name="pattern"
                type="text"
                placeholder="例如：connection refused"
                className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[#314254]">异常类型</span>
                <input
                  name="errorType"
                  type="text"
                  placeholder="例如：connection_refused"
                  className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[#314254]">风险等级</span>
                <select
                  name="riskLevel"
                  defaultValue="medium"
                  className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9]"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[#314254]">Regex 标志</span>
                <input
                  name="flags"
                  type="text"
                  placeholder="例如：i"
                  className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#314254]">适用来源</span>
              <input
                name="sourceTypes"
                type="text"
                placeholder="例如：nginx,application"
                className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#314254]">规则说明</span>
              <textarea
                name="description"
                rows={3}
                placeholder="可选"
                className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
              />
            </label>

            <SubmitButton
              idleText="直接沉淀规则"
              pendingText="正在保存规则..."
              className="w-full rounded-2xl bg-[#1f4e79] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173d61]"
            />
          </form>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <SummaryCard label="规则总数" value={`${ruleSummary.total}`} tone="info" />
            <SummaryCard label="已启用规则" value={`${ruleSummary.enabled}`} tone="success" />
          </div>

          <div className="mt-5 space-y-3">
            {ruleSummary.recentRules.length === 0 ? (
              <EmptyState text="当前还没有沉淀规则。" />
            ) : (
              ruleSummary.recentRules.map((rule) => (
                <div key={rule.id} className="rounded-3xl border border-[#dce4ee] bg-white p-4 transition hover:border-[#9db3cd] hover:shadow-[0_10px_26px_rgba(31,42,55,0.1)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#1f2a37]">{rule.name}</p>
                    <StatusPill label={formatErrorType(rule.errorType)} tone="warning" />
                    <StatusPill label={getRiskLabel(rule.riskLevel)} tone={getRiskTone(rule.riskLevel)} />
                  </div>
                  <p className="mt-2 text-xs text-[#7b8898]">最近更新时间：{formatTimestamp(rule.updatedAt)}</p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </section>
    </>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "neutral" | "info";
}) {
  return (
    <div className="dashboard-panel rounded-[28px] border border-[#dce4ee] bg-white p-5 shadow-[0_12px_35px_rgba(31,42,55,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#5b8fb9]">{label}</p>
          <p className="mt-4 text-3xl font-semibold text-[#1f2a37]">{value}</p>
        </div>
        <StatusPill label={label} tone={tone} />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#cfd8e4] bg-[#f7f9fc] px-4 py-8 text-center text-sm text-[#5f6b7a]">
      {text}
    </div>
  );
}

function getReviewTone(status: string) {
  if (status === "completed") return "success";
  if (status === "skipped") return "neutral";
  return "warning";
}

function getReviewLabel(status: string) {
  if (status === "completed") return "已完成";
  if (status === "skipped") return "已跳过";
  return "待复查";
}

function getRiskTone(riskLevel: string) {
  if (riskLevel === "high") return "danger";
  if (riskLevel === "low") return "success";
  return "warning";
}

function getRiskLabel(riskLevel: string) {
  if (riskLevel === "high") return "高风险";
  if (riskLevel === "low") return "低风险";
  return "中风险";
}

function formatTimestamp(value: string) {
  if (!value) return "暂无时间";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatErrorType(value: string) {
  return toIssueTypeDisplayName(value);
}
