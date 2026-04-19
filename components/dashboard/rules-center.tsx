import { createDetectionRuleAction } from "@/app/rules/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";

type RulesCenterProps = {
  status?: string;
  message?: string;
  defaultRuleCount: number;
  dynamicRules: {
    id: string;
    name: string;
    pattern: string;
    matchType: string;
    errorType: string;
    riskLevel: string;
    sourceTypes: string[];
    enabled: boolean;
    updatedAt: string;
  }[];
};

export function RulesCenter({
  status,
  message,
  defaultRuleCount,
  dynamicRules,
}: RulesCenterProps) {
  const tone =
    status === "error" ? "danger" : status === "success" ? "success" : "info";
  const enabledCount = dynamicRules.filter((rule) => rule.enabled).length;

  return (
    <>
      {message ? (
        <section className="dashboard-panel rounded-[28px] border border-[#dce4ee] bg-white p-4 shadow-[0_14px_42px_rgba(31,42,55,0.1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#1f2a37]">Rules Status</p>
              <p className="mt-2 text-sm leading-6 text-[#5f6b7a]">{message}</p>
            </div>
            <StatusPill label={status ?? "info"} tone={tone} />
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "内置规则",
            value: `${defaultRuleCount}`,
            hint: "代码默认规则",
          },
          {
            label: "动态规则",
            value: `${dynamicRules.length}`,
            hint: "数据库规则总数",
          },
          {
            label: "已启用",
            value: `${enabledCount}`,
            hint: "当前会参与检测",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="dashboard-panel rounded-[28px] border border-[#dce4ee] bg-white p-5 shadow-[0_12px_35px_rgba(31,42,55,0.08)]"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#5b8fb9]">
              {card.label}
            </p>
            <p className="mt-4 text-3xl font-semibold text-[#1f2a37]">{card.value}</p>
            <p className="mt-2 text-sm text-[#5f6b7a]">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          eyebrow="Rules"
          title="录入动态规则"
          description="这里专门做规则沉淀，不再和首页总览混在一起。后续候选规则和人工复核也会挂到这里。"
        >
          <form action={createDetectionRuleAction} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[#314254]">
                  规则名称
                </span>
                <input
                  name="name"
                  type="text"
                  placeholder="例如：Billing Connection Refused"
                  className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[#314254]">
                  匹配类型
                </span>
                <select
                  name="matchType"
                  defaultValue="keyword"
                  className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9]"
                >
                  <option value="keyword">Keyword</option>
                  <option value="regex">Regex</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#314254]">匹配模式</span>
              <input
                name="pattern"
                type="text"
                placeholder="例如：connection refused 或 \\b5\\d\\d\\b"
                className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[#314254]">
                  异常类型
                </span>
                <input
                  name="errorType"
                  type="text"
                  placeholder="例如：connection_refused"
                  className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[#314254]">
                  风险等级
                </span>
                <select
                  name="riskLevel"
                  defaultValue="medium"
                  className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-[#314254]">
                  Regex 标志
                </span>
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
                placeholder="例如：nginx,application,custom"
                className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#314254]">说明</span>
              <textarea
                name="description"
                rows={4}
                placeholder="记录这条规则为什么要存在，它适用于什么场景。"
                className="w-full rounded-2xl border border-[#c4d2e3] bg-white px-4 py-3 text-sm text-[#1f2a37] outline-none transition focus:border-[#5b8fb9] placeholder:text-[#8a98a8]"
              />
            </label>

            <div className="rounded-2xl border border-[#dce4ee] bg-[#f8fafc] px-4 py-3 text-xs leading-6 text-[#5f6b7a]">
              原则上只沉淀高频、稳定、重复出现的问题模式。偶发问题先走人工复核和候选规则更稳。
            </div>
            <SubmitButton
              idleText="保存动态规则"
              pendingText="正在写入 detection_rules..."
              className="w-full rounded-2xl bg-[#1f4e79] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173d61]"
            />
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Library"
          title="当前动态规则"
          description="这里集中展示规则库。后续如果要启停规则、审核候选规则，也会在这页继续扩。"
        >
          <div className="space-y-3">
            {dynamicRules.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#cfd8e4] bg-[#f7f9fc] px-4 py-8 text-center text-sm text-[#5f6b7a]">
                还没有动态规则。录入第一条团队规则后，这里会显示出来。
              </div>
            ) : (
              dynamicRules.map((rule) => (
                <div
                  key={rule.id}
                  className="dashboard-panel rounded-3xl border border-[#dce4ee] bg-white p-4 transition hover:border-[#9db3cd] hover:shadow-[0_10px_26px_rgba(31,42,55,0.1)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#1f2a37]">{rule.name}</p>
                        <StatusPill
                          label={rule.enabled ? "enabled" : "disabled"}
                          tone={rule.enabled ? "success" : "neutral"}
                        />
                        <StatusPill
                          label={rule.riskLevel}
                          tone={getRiskTone(rule.riskLevel)}
                        />
                      </div>
                      <p className="mt-2 break-all font-mono text-xs text-[#3a6a9a]">
                        {rule.pattern}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-[#5f6b7a]">
                        {rule.matchType} · {rule.errorType}
                        {rule.sourceTypes.length > 0
                          ? ` · ${rule.sourceTypes.join(", ")}`
                          : " · all sources"}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatTimestamp(rule.updatedAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </section>
    </>
  );
}

function formatTimestamp(value: string) {
  if (!value) {
    return "No timestamp";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getRiskTone(riskLevel: string) {
  if (riskLevel === "high") {
    return "danger";
  }

  if (riskLevel === "low") {
    return "success";
  }

  return "warning";
}
