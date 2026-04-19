import Link from "next/link";
import { createLogUploadAction } from "@/app/logs/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";

type DashboardOverviewProps = {
  status?: string;
  message?: string;
  metrics: {
    label: string;
    value: string;
    hint: string;
    tone: "info" | "success" | "warning" | "danger";
    href: string;
  }[];
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

export function DashboardOverview({
  status,
  message,
  metrics,
  typeBreakdown,
  riskBreakdown,
  modeComparison,
}: DashboardOverviewProps) {
  const tone =
    status === "error" ? "danger" : status === "success" ? "success" : "info";

  return (
    <>
      {message ? (
        <section className="dashboard-panel rounded-[28px] border border-[#dce4ee] bg-white p-4 shadow-[0_14px_42px_rgba(31,42,55,0.1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#1f2a37]">系统提示</p>
              <p className="mt-2 text-sm leading-6 text-[#5f6b7a]">{message}</p>
            </div>
            <StatusPill label={status === "success" ? "成功" : status === "error" ? "失败" : "提示"} tone={tone} />
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <SectionCard
          eyebrow="Upload"
          title="日志上传与分析"
          description="首页只保留上传入口。系统默认使用混合分析，分析完成后会直接跳转到本次文件的详情页。"
        >
          <form action={createLogUploadAction} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#314254]">日志文件</span>
              <input
                name="logFile"
                type="file"
                accept=".log,.txt,.json,.out,.csv,text/plain,application/json"
                className="w-full rounded-2xl border border-dashed border-[#c4d2e3] bg-[#f8fbff] px-4 py-4 text-sm text-[#314254] file:mr-4 file:rounded-full file:border-0 file:bg-[#1f4e79] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-[1fr_0.9fr]">
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[#314254]">Source Type</span>
                <select
                  name="sourceType"
                  defaultValue="nginx"
                  className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9]"
                >
                  <option value="nginx">Nginx</option>
                  <option value="system">System</option>
                  <option value="PostgreSQL">PostgreSQL</option>
                  <option value="application">Application</option>
                  <option value="custom">Custom</option>
                </select>
              </label>

              <div className="rounded-2xl border border-[#d3dde8] bg-[#f5f9ff] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#5b8fb9]">分析方式</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1f2a37]">Hybrid</p>
                    <p className="mt-1 text-xs leading-6 text-[#5f6b7a]">
                      规则负责粗筛，模型负责细判。首页不再给用户切换分析模式。
                    </p>
                  </div>
                  <StatusPill label="默认启用" tone="success" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#dce4ee] bg-[#f8fafc] px-4 py-3 text-xs leading-6 text-[#5f6b7a]">
              上传成功后，系统会自动写入 <code>logs</code>、<code>log_errors</code> 和 <code>analysis_results</code>，并直接打开本次分析详情。
            </div>

            <SubmitButton
              idleText="上传并开始分析"
              pendingText="正在上传并生成分析结果..."
              className="w-full rounded-2xl bg-[#1f4e79] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173d61]"
            />
          </form>
        </SectionCard>

        <section className="grid gap-4 md:grid-cols-2">
          {metrics.map((metric) => (
            <Link
              key={metric.label}
              href={metric.href}
              className="dashboard-panel rounded-[28px] border border-[#dce4ee] bg-white p-5 shadow-[0_12px_35px_rgba(31,42,55,0.08)] transition hover:-translate-y-0.5 hover:border-[#99b0cb] hover:shadow-[0_16px_38px_rgba(31,42,55,0.12)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#5b8fb9]">
                    {metric.label}
                  </p>
                  <p className="mt-4 text-3xl font-semibold text-[#1f2a37]">{metric.value}</p>
                  <p className="mt-2 text-sm text-[#5f6b7a]">{metric.hint}</p>
                </div>
                <StatusPill label="查看" tone={metric.tone} />
              </div>
            </Link>
          ))}
        </section>
      </section>

      <OverviewCharts
        typeBreakdown={typeBreakdown}
        riskBreakdown={riskBreakdown}
        modeComparison={modeComparison}
      />
    </>
  );
}