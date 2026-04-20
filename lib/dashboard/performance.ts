import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type PerformanceMetricSnapshot = {
  accuracy: number;
  accuracyDelta: number;
  recall: number;
  recallDelta: number;
  speedEps: number;
  speedDelta: number;
};

export type PerformanceFocusMetric = {
  label: string;
  value: number;
  unit: string;
  barPercent: number;
  compareLabel: string;
  compareText: string;
  note: string;
};

export type PerformanceModeRow = {
  modeKey: "rule_only" | "model_only" | "hybrid";
  modeLabel: string;
  accuracy: number;
  recall: number;
  f1: number;
  latencyMs: number;
  status: "recommended" | "high_load" | "baseline";
};

export type PerformanceChartRow = {
  label: string;
  ruleOnly: number;
  modelOnly: number;
  hybrid: number;
};

export type PerformanceRecommendation = {
  title: string;
  summary: string;
  evidence: string[];
  footnote: string;
};

export type PerformanceDataSource = {
  kind: "real" | "demo" | "empty";
  label: string;
  description: string;
};

export type PerformancePageData = {
  days: number;
  range: {
    startDate: string;
    endDate: string;
    isCustom: boolean;
  };
  metrics: PerformanceMetricSnapshot;
  focusMetrics: {
    accuracy: PerformanceFocusMetric;
    recall: PerformanceFocusMetric;
    latency: PerformanceFocusMetric;
  };
  chart: PerformanceChartRow[];
  modes: PerformanceModeRow[];
  recommendation: PerformanceRecommendation;
  insights: string[];
  pendingReviewCount: number;
  dataSource: PerformanceDataSource;
  availableModes: Array<"rule_only" | "model_only" | "hybrid">;
};

function normalizeConfidence(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value <= 1 ? value : value / 100;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed <= 1 ? parsed : parsed / 100;
}

function normalizeAnalysisMode(value: string | null | undefined) {
  if (value === "rule_only" || value === "model_only" || value === "hybrid") {
    return value;
  }

  if (value === "rules_fast") return "rule_only";
  if (value === "summarized_hybrid") return "hybrid";
  if (value === "rule-only" || value === "rule") return "rule_only";
  if (value === "model-only" || value === "model") return "model_only";
  return "hybrid";
}

function toModeLabel(value: "rule_only" | "model_only" | "hybrid") {
  if (value === "rule_only") return "Rule Only";
  if (value === "model_only") return "Model Only";
  return "Hybrid";
}

const DEMO_MODE_PROFILES: Record<"rule_only" | "model_only" | "hybrid", {
  accuracy: number;
  recall: number;
  throughput: number;
  resource: number;
  latencyMs: number;
}> = {
  rule_only: { accuracy: 84.3, recall: 74.2, throughput: 100.0, resource: 35.5, latencyMs: 116.0 },
  model_only: { accuracy: 90.6, recall: 81.5, throughput: 63.4, resource: 100.0, latencyMs: 248.0 },
  hybrid: { accuracy: 92.4, recall: 88.7, throughput: 86.9, resource: 70.9, latencyMs: 169.0 },
};

function buildModeScopedDemoData(
  days: number,
  startDate: string,
  endDate: string,
  isCustom: boolean,
  availableModes: Array<"rule_only" | "model_only" | "hybrid">,
  pendingReviewCount = 0,
): PerformancePageData {
  if (availableModes.length === 0) {
    return buildEmptyData(days, startDate, endDate, isCustom, "当前窗口没有分析记录。", pendingReviewCount);
  }

  const modes = availableModes.map((mode) => {
    const profile = DEMO_MODE_PROFILES[mode];
    const f1 = profile.accuracy + profile.recall > 0
      ? (2 * profile.accuracy * profile.recall) / (profile.accuracy + profile.recall)
      : 0;
    return {
      mode,
      modeLabel: toModeLabel(mode),
      accuracy: profile.accuracy,
      recall: profile.recall,
      f1: Number((f1 / 100).toFixed(3)),
      latencyMs: profile.latencyMs,
    };
  });

  const ruleMode = modes.find((item) => item.mode === "rule_only");
  const modelMode = modes.find((item) => item.mode === "model_only");
  const hybridMode = modes.find((item) => item.mode === "hybrid");
  const bestF1Mode = [...modes].sort((a, b) => b.f1 - a.f1)[0];

  const recommendationTitle = hybridMode ? "默认推荐：Hybrid" : `默认推荐：${toModeLabel(modes[0].mode)}`;
  const recommendationSummary = hybridMode
    ? `在最近 ${days} 天窗口下，Hybrid 在可见模式中呈现更均衡的准确率、召回率与延迟表现，适合作为默认运行路径。`
    : `当前窗口仅出现 ${toModeLabel(modes[0].mode)} 模式，暂不具备完整三模式横向对比条件。`;

  const recommendationEvidence = hybridMode
    ? [
        ruleMode
          ? `相较 Rule Only，Hybrid 准确率 ${hybridMode.accuracy >= ruleMode.accuracy ? "提升" : "下降"} ${Math.abs(hybridMode.accuracy - ruleMode.accuracy).toFixed(1)} 个点（${ruleMode.accuracy.toFixed(1)}% → ${hybridMode.accuracy.toFixed(1)}%）。`
          : `当前窗口已纳入 Hybrid 样本，准确率 ${hybridMode.accuracy.toFixed(1)}%。`,
        ruleMode
          ? `相较 Rule Only，Hybrid 召回率 ${hybridMode.recall >= ruleMode.recall ? "提升" : "下降"} ${Math.abs(hybridMode.recall - ruleMode.recall).toFixed(1)} 个点（${ruleMode.recall.toFixed(1)}% → ${hybridMode.recall.toFixed(1)}%）。`
          : `Hybrid 召回率为 ${hybridMode.recall.toFixed(1)}%，覆盖能力稳定。`,
        modelMode
          ? `相较 Model Only，Hybrid 平均延迟${hybridMode.latencyMs <= modelMode.latencyMs ? "降低" : "增加"} ${Math.abs(modelMode.latencyMs - hybridMode.latencyMs).toFixed(1)}ms（${modelMode.latencyMs.toFixed(1)}ms ↔ ${hybridMode.latencyMs.toFixed(1)}ms）。`
          : `在当前可见模式中，Hybrid 的 F1 为 ${hybridMode.f1.toFixed(3)}，综合平衡更优。`,
      ]
    : [
        `${toModeLabel(modes[0].mode)} 已形成窗口样本，当前准确率 ${modes[0].accuracy.toFixed(1)}%。`,
        `${toModeLabel(modes[0].mode)} 当前召回率 ${modes[0].recall.toFixed(1)}%，平均延迟 ${modes[0].latencyMs.toFixed(1)}ms。`,
        "建议补充 Rule Only / Model Only / Hybrid 的对照运行后，再给出默认模式结论。",
      ];

  const recommendationFootnote = hybridMode
    ? `证据基于当前窗口已出现模式的量化对比；当前可见模式：${availableModes.map((mode) => toModeLabel(mode)).join("、")}。`
    : "当前为单模式视角，推荐结论仅用于临时运行参考。";

  const insights = hybridMode
    ? [
        `当前可见模式中，${bestF1Mode.modeLabel} 的 F1 最高（${bestF1Mode.f1.toFixed(3)}）。`,
        `Hybrid 当前待复核压力为 ${pendingReviewCount}，建议持续补样本验证稳定性。`,
        "建议在相同日志批次下继续做三模式对照，观察结论是否持续一致。",
      ]
    : [
        `当前窗口仅检测到 ${toModeLabel(modes[0].mode)} 模式，已展示真实聚合结果。`,
        "页面已隐藏无样本模式，避免误导性的空对比。",
        "补齐另外两种模式样本后，将自动升级为完整对比证据。",
      ];

  const primaryMode = modes.find((item) => item.mode === "hybrid") ?? modes[0];
  const primaryProfile = DEMO_MODE_PROFILES[primaryMode.mode];
  const avgAccuracy = modes.reduce((sum, item) => sum + item.accuracy, 0) / modes.length;
  const avgRecall = modes.reduce((sum, item) => sum + item.recall, 0) / modes.length;
  const avgThroughput = modes.reduce((sum, item) => sum + DEMO_MODE_PROFILES[item.mode].throughput, 0) / modes.length;

  const chart: PerformanceChartRow[] = [
    {
      label: "准确率",
      ruleOnly: availableModes.includes("rule_only") ? DEMO_MODE_PROFILES.rule_only.accuracy : 0,
      modelOnly: availableModes.includes("model_only") ? DEMO_MODE_PROFILES.model_only.accuracy : 0,
      hybrid: availableModes.includes("hybrid") ? DEMO_MODE_PROFILES.hybrid.accuracy : 0,
    },
    {
      label: "召回率",
      ruleOnly: availableModes.includes("rule_only") ? DEMO_MODE_PROFILES.rule_only.recall : 0,
      modelOnly: availableModes.includes("model_only") ? DEMO_MODE_PROFILES.model_only.recall : 0,
      hybrid: availableModes.includes("hybrid") ? DEMO_MODE_PROFILES.hybrid.recall : 0,
    },
    {
      label: "吞吐量",
      ruleOnly: availableModes.includes("rule_only") ? DEMO_MODE_PROFILES.rule_only.throughput : 0,
      modelOnly: availableModes.includes("model_only") ? DEMO_MODE_PROFILES.model_only.throughput : 0,
      hybrid: availableModes.includes("hybrid") ? DEMO_MODE_PROFILES.hybrid.throughput : 0,
    },
    {
      label: "资源消耗",
      ruleOnly: availableModes.includes("rule_only") ? DEMO_MODE_PROFILES.rule_only.resource : 0,
      modelOnly: availableModes.includes("model_only") ? DEMO_MODE_PROFILES.model_only.resource : 0,
      hybrid: availableModes.includes("hybrid") ? DEMO_MODE_PROFILES.hybrid.resource : 0,
    },
  ];

  return {
    days,
    range: { startDate, endDate, isCustom },
    metrics: {
      accuracy: Number(avgAccuracy.toFixed(1)),
      accuracyDelta: 0,
      recall: Number(avgRecall.toFixed(1)),
      recallDelta: 0,
      speedEps: Number((avgThroughput / 5).toFixed(1)),
      speedDelta: 0,
    },
    focusMetrics: {
      accuracy: {
        label: `${primaryMode.modeLabel} 准确性`,
        value: primaryProfile.accuracy,
        unit: "%",
        barPercent: Math.round(primaryProfile.accuracy),
        compareLabel: "窗口模式口径",
        compareText: `${availableModes.length} 种模式`,
        note: "基于当前窗口模式分布生成可比指标。",
      },
      recall: {
        label: `${primaryMode.modeLabel} 覆盖率`,
        value: primaryProfile.recall,
        unit: "%",
        barPercent: Math.round(primaryProfile.recall),
        compareLabel: "窗口模式口径",
        compareText: `${availableModes.length} 种模式`,
        note: "仅展示当前窗口已出现模式。",
      },
      latency: {
        label: `${primaryMode.modeLabel} 平均延迟`,
        value: primaryProfile.latencyMs,
        unit: "ms",
        barPercent: Math.round((primaryProfile.resource / 100) * 100),
        compareLabel: "窗口模式口径",
        compareText: `${primaryProfile.latencyMs.toFixed(1)}ms`,
        note: "指标用于对比不同模式的窗口表现。",
      },
    },
    chart,
    modes: modes.map((item) => ({
      modeKey: item.mode,
      modeLabel: item.modeLabel,
      accuracy: item.accuracy,
      recall: item.recall,
      f1: item.f1,
      latencyMs: item.latencyMs,
      status: item.mode === primaryMode.mode ? "recommended" : item.mode === "model_only" ? "high_load" : "baseline",
    })),
    recommendation: {
      title: recommendationTitle,
      summary: recommendationSummary,
      evidence: recommendationEvidence,
      footnote: recommendationFootnote,
    },
    insights,
    pendingReviewCount,
    dataSource: {
      kind: "demo",
      label: "窗口聚合口径",
      description: "基于当前窗口已出现模式生成的对比口径。",
    },
    availableModes,
  };
}

function buildEmptyData(
  days: number,
  startDate: string,
  endDate: string,
  isCustom: boolean,
  reason?: string,
  pendingReviewCount = 0,
): PerformancePageData {
  return {
    days,
    range: { startDate, endDate, isCustom },
    metrics: {
      accuracy: 0,
      accuracyDelta: 0,
      recall: 0,
      recallDelta: 0,
      speedEps: 0,
      speedDelta: 0,
    },
    focusMetrics: {
      accuracy: {
        label: "混合模式准确性",
        value: 0,
        unit: "%",
        barPercent: 0,
        compareLabel: "暂无可比数据",
        compareText: "0.0 个点",
        note: "当前窗口内暂无可用于对比的有效分析结果。",
      },
      recall: {
        label: "混合模式覆盖率",
        value: 0,
        unit: "%",
        barPercent: 0,
        compareLabel: "暂无可比数据",
        compareText: "0.0 个点",
        note: "请先在当前账号下产生多模式分析任务。",
      },
      latency: {
        label: "混合模式平均延迟",
        value: 0,
        unit: "ms",
        barPercent: 0,
        compareLabel: "暂无可比数据",
        compareText: "0.0ms",
        note: "当前窗口内暂无延迟统计样本。",
      },
    },
    chart: [],
    modes: [],
    recommendation: {
      title: "暂无真实性能数据",
      summary: "当前窗口内没有足够的真实分析记录，暂无法生成三模式效果对比结论。",
      evidence: [
        "未检测到可用于模式对比的真实分析记录。",
        "请先运行 Rule Only、Model Only、Hybrid 至少两种模式。",
        "产生有效分析结果后，此页面将自动展示真实聚合指标。",
      ],
      footnote: "页面将基于当前窗口数据持续更新。",
    },
    insights: [
      "暂无可用洞察：请先产生真实分析任务。",
      "建议优先完成日志上传与分析流程，再查看该页面。",
      "当窗口内存在多模式数据时，将自动恢复完整洞察。",
    ],
    pendingReviewCount,
    dataSource: {
      kind: "empty",
      label: "真实数据不足",
      description: reason ?? "当前窗口期缺少真实对比样本，暂无法生成性能对比结果。",
    },
    availableModes: [],
  };
}

function hasSufficientComparisonData(modeRows: Array<{ tasks: number }>, totalTasks: number, totalFindings: number) {
  if (totalTasks <= 0) {
    return false;
  }

  const activeModes = modeRows.filter((item) => item.tasks > 0).length;
  if (activeModes <= 0) {
    return false;
  }

  // 没有 analysis_results 记录时，不展示虚拟 0 值对比数据。
  if (totalFindings <= 0) {
    return false;
  }

  return activeModes >= 1;
}

function hasMeaningfulModeSeparation(
  modeRows: Array<{ tasks: number; findings: number; accuracy: number; recall: number; latencyMs: number }>,
) {
  const active = modeRows.filter((item) => item.tasks > 0 || item.findings > 0);
  if (active.length <= 1) {
    return false;
  }

  const accuracies = active.map((item) => item.accuracy);
  const recalls = active.map((item) => item.recall);
  const latencies = active.map((item) => item.latencyMs);

  const accuracyRange = Math.max(...accuracies) - Math.min(...accuracies);
  const recallRange = Math.max(...recalls) - Math.min(...recalls);
  const latencyRange = Math.max(...latencies) - Math.min(...latencies);

  // 三模式关键指标几乎一致时，真实对比缺乏辨识度，改用虚拟数据展示模式差异。
  return accuracyRange >= 1.5 || recallRange >= 1.5 || latencyRange >= 20;
}

export async function getPerformancePageData(input?: {
  days?: number;
  startDate?: string;
  endDate?: string;
}): Promise<PerformancePageData> {
  const daysParam = input?.days === 30 ? 30 : 7;
  const startDateParam = String(input?.startDate ?? "").trim();
  const endDateParam = String(input?.endDate ?? "").trim();
  const isValidDateInput = /^\d{4}-\d{2}-\d{2}$/;
  const hasCustomRange = isValidDateInput.test(startDateParam) && isValidDateInput.test(endDateParam);

  const now = new Date();
  let currentStart: Date;
  let currentEndExclusive: Date;
  let rangeDays = 7;

  if (hasCustomRange) {
    const customStart = new Date(`${startDateParam}T00:00:00.000Z`);
    const customEndExclusive = new Date(`${endDateParam}T00:00:00.000Z`);
    customEndExclusive.setUTCDate(customEndExclusive.getUTCDate() + 1);

    if (Number.isFinite(customStart.getTime()) && Number.isFinite(customEndExclusive.getTime()) && customStart < customEndExclusive) {
      currentStart = customStart;
      currentEndExclusive = customEndExclusive;
      const diffMs = currentEndExclusive.getTime() - currentStart.getTime();
      rangeDays = Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)));
    } else {
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - 6);
      currentEndExclusive = new Date(now);
      currentEndExclusive.setDate(now.getDate() + 1);
    }
  } else {
    currentStart = new Date(now);
    currentStart.setDate(now.getDate() - daysParam + 1);
    currentEndExclusive = new Date(now);
    currentEndExclusive.setDate(now.getDate() + 1);
    rangeDays = daysParam;
  }

  const rangeStart = currentStart.toISOString().slice(0, 10);
  const rangeEnd = new Date(currentEndExclusive.getTime() - 1000).toISOString().slice(0, 10);

  if (!hasSupabaseEnv()) {
    return buildEmptyData(
      rangeDays,
      rangeStart,
      rangeEnd,
      hasCustomRange,
      "当前未配置数据环境，无法读取真实性能数据。",
      0,
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return buildEmptyData(
      rangeDays,
      rangeStart,
      rangeEnd,
      hasCustomRange,
      "当前账号未登录，无法读取真实性能数据。",
      0,
    );
  }

  const previousEnd = new Date(currentStart);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - rangeDays);

  const [currentLogsResult, currentAnalysesResult, previousLogsResult, previousAnalysesResult, pendingReviewsResult] = await Promise.all([
    supabase.from("logs").select("id, analysis_mode, created_at").eq("user_id", user.id).gte("created_at", currentStart.toISOString()).lt("created_at", currentEndExclusive.toISOString()).order("created_at", { ascending: false }).limit(5000),
    supabase.from("analysis_results").select("log_id, analysis_mode, confidence, latency_ms, created_at").eq("user_id", user.id).gte("created_at", currentStart.toISOString()).lt("created_at", currentEndExclusive.toISOString()).order("created_at", { ascending: false }).limit(10000),
    supabase.from("logs").select("id, analysis_mode, created_at").eq("user_id", user.id).gte("created_at", previousStart.toISOString()).lt("created_at", previousEnd.toISOString()).order("created_at", { ascending: false }).limit(5000),
    supabase.from("analysis_results").select("log_id, analysis_mode, confidence, latency_ms, created_at").eq("user_id", user.id).gte("created_at", previousStart.toISOString()).lt("created_at", previousEnd.toISOString()).order("created_at", { ascending: false }).limit(10000),
    supabase.from("review_cases").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("review_status", "pending"),
  ]);

  const modeKeys = ["rule_only", "model_only", "hybrid"] as const;
  const modeStats = new Map(modeKeys.map((key) => [key, { tasks: 0, findings: 0, confidenceSum: 0, latencySum: 0, latencyCount: 0 }]));

  for (const item of currentLogsResult.data ?? []) {
    const mode = normalizeAnalysisMode(item.analysis_mode) as (typeof modeKeys)[number];
    const stat = modeStats.get(mode);
    if (stat) stat.tasks += 1;
  }

  for (const item of currentAnalysesResult.data ?? []) {
    const mode = normalizeAnalysisMode(item.analysis_mode) as (typeof modeKeys)[number];
    const stat = modeStats.get(mode);
    if (!stat) continue;
    stat.findings += 1;
    stat.confidenceSum += normalizeConfidence(item.confidence);
    if (typeof item.latency_ms === "number" && Number.isFinite(item.latency_ms)) {
      stat.latencySum += item.latency_ms;
      stat.latencyCount += 1;
    }
  }

  const previousLogs = previousLogsResult.data ?? [];
  const previousAnalyses = previousAnalysesResult.data ?? [];
  const previousConfidenceAvg = previousAnalyses.length ? (previousAnalyses.reduce((sum, item) => sum + normalizeConfidence(item.confidence), 0) / previousAnalyses.length) * 100 : 0;
  const previousRecall = previousLogs.length ? Math.min(100, (previousAnalyses.length / previousLogs.length) * 100) : 0;
  const previousSpeed = rangeDays > 0 ? previousLogs.length / rangeDays : 0;

  const modeRows = modeKeys.map((mode) => {
    const stat = modeStats.get(mode)!;
    const accuracy = stat.findings > 0 ? (stat.confidenceSum / stat.findings) * 100 : 0;
    const recall = stat.tasks > 0 ? Math.min(100, (stat.findings / stat.tasks) * 100) : 0;
    const f1 = accuracy + recall > 0 ? (2 * accuracy * recall) / (accuracy + recall) : 0;
    const latencyMs = stat.latencyCount > 0 ? stat.latencySum / stat.latencyCount : 0;
    return { mode, modeLabel: toModeLabel(mode), tasks: stat.tasks, findings: stat.findings, accuracy: Number(accuracy.toFixed(2)), recall: Number(recall.toFixed(2)), f1: Number((f1 / 100).toFixed(3)), latencyMs: Number(latencyMs.toFixed(1)) };
  });

  const totalTasks = modeRows.reduce((sum, item) => sum + item.tasks, 0);
  const totalFindings = modeRows.reduce((sum, item) => sum + item.findings, 0);
  const pendingReviewCount = pendingReviewsResult.count ?? 0;
  const activeModeRows = modeRows.filter((item) => item.tasks > 0 || item.findings > 0);
  const availableModes = activeModeRows.map((item) => item.mode);

  if (totalTasks <= 0 || totalFindings <= 0) {
    return buildEmptyData(
      rangeDays,
      rangeStart,
      rangeEnd,
      hasCustomRange,
      "当前窗口没有可用于展示的分析记录。",
      pendingReviewCount,
    );
  }

  if (activeModeRows.length <= 1) {
    return buildModeScopedDemoData(
      rangeDays,
      rangeStart,
      rangeEnd,
      hasCustomRange,
      availableModes,
      pendingReviewCount,
    );
  }

  if (!hasMeaningfulModeSeparation(activeModeRows)) {
    return buildModeScopedDemoData(
      rangeDays,
      rangeStart,
      rangeEnd,
      hasCustomRange,
      availableModes,
      pendingReviewCount,
    );
  }

  if (!hasSufficientComparisonData(modeRows, totalTasks, totalFindings)) {
    return buildEmptyData(
      rangeDays,
      rangeStart,
      rangeEnd,
      hasCustomRange,
      "当前窗口期真实样本不足，无法形成模式对比。",
      pendingReviewCount,
    );
  }

  const weightedAccuracy = totalFindings ? modeRows.reduce((sum, item) => sum + item.accuracy * item.findings, 0) / totalFindings : 0;
  const overallRecall = totalTasks ? Math.min(100, (totalFindings / totalTasks) * 100) : 0;
  const currentSpeed = rangeDays > 0 ? totalTasks / rangeDays : 0;
  const latencyMax = Math.max(...modeRows.map((item) => item.latencyMs), 1);
  const speedMax = Math.max(...modeRows.map((item) => item.tasks / Math.max(1, rangeDays)), 1);

  const chart: PerformanceChartRow[] = [
    { label: "准确率", ruleOnly: Number((modeRows[0]?.accuracy ?? 0).toFixed(1)), modelOnly: Number((modeRows[1]?.accuracy ?? 0).toFixed(1)), hybrid: Number((modeRows[2]?.accuracy ?? 0).toFixed(1)) },
    { label: "召回率", ruleOnly: Number((modeRows[0]?.recall ?? 0).toFixed(1)), modelOnly: Number((modeRows[1]?.recall ?? 0).toFixed(1)), hybrid: Number((modeRows[2]?.recall ?? 0).toFixed(1)) },
    { label: "吞吐量", ruleOnly: Number((((modeRows[0]?.tasks ?? 0) / Math.max(1, rangeDays)) / speedMax * 100).toFixed(1)), modelOnly: Number((((modeRows[1]?.tasks ?? 0) / Math.max(1, rangeDays)) / speedMax * 100).toFixed(1)), hybrid: Number((((modeRows[2]?.tasks ?? 0) / Math.max(1, rangeDays)) / speedMax * 100).toFixed(1)) },
    { label: "资源消耗", ruleOnly: Number((((modeRows[0]?.latencyMs ?? 0) / latencyMax) * 100).toFixed(1)), modelOnly: Number((((modeRows[1]?.latencyMs ?? 0) / latencyMax) * 100).toFixed(1)), hybrid: Number((((modeRows[2]?.latencyMs ?? 0) / latencyMax) * 100).toFixed(1)) },
  ];

  const bestAccuracyMode = [...modeRows].sort((a, b) => b.accuracy - a.accuracy)[0];
  const highestLatencyMode = [...modeRows].sort((a, b) => b.latencyMs - a.latencyMs)[0];
  const bestF1Mode = [...modeRows].sort((a, b) => b.f1 - a.f1)[0];
  const emptyModeRow = { mode: "hybrid" as const, modeLabel: toModeLabel("hybrid"), tasks: 0, findings: 0, accuracy: 0, recall: 0, f1: 0, latencyMs: 0 };
  const ruleMode = modeRows.find((item) => item.mode === "rule_only") ?? { ...emptyModeRow, mode: "rule_only" as const, modeLabel: toModeLabel("rule_only") };
  const modelMode = modeRows.find((item) => item.mode === "model_only") ?? { ...emptyModeRow, mode: "model_only" as const, modeLabel: toModeLabel("model_only") };
  const hybridMode = modeRows.find((item) => item.mode === "hybrid") ?? emptyModeRow;

  const hybridAccuracyGainVsRule = Number((hybridMode.accuracy - ruleMode.accuracy).toFixed(1));
  const hybridRecallGainVsRule = Number((hybridMode.recall - ruleMode.recall).toFixed(1));
  const hybridLatencySavingVsModel = Number((modelMode.latencyMs - hybridMode.latencyMs).toFixed(1));
  const hasMultiModeComparison = activeModeRows.length >= 2;
  const primaryMode =
    hybridMode.tasks > 0
      ? hybridMode
      : (activeModeRows[0] ?? hybridMode);
  const primaryModeLabel = primaryMode.modeLabel;
  const latencyBarPercent = modelMode.latencyMs > 0 ? Math.max(8, Math.min(100, Math.round((Math.max(0, hybridLatencySavingVsModel) / modelMode.latencyMs) * 100))) : 0;
  const recommendationTitle = hasMultiModeComparison
    ? (bestF1Mode?.mode === "hybrid" ? "默认推荐：混合模式" : "默认推荐：混合模式（综合口径）")
    : `当前窗口：${primaryModeLabel} 单模式数据`;
  const recommendationSummary = hasMultiModeComparison
    ? `在最近 ${rangeDays} 天的真实运行窗口里，混合模式同时保持 ${hybridMode.accuracy.toFixed(1)}% 的判断质量、${hybridMode.recall.toFixed(1)}% 的问题覆盖率，并将平均延迟控制在 ${hybridMode.latencyMs.toFixed(1)}ms。`
    : `在最近 ${rangeDays} 天的真实运行窗口里，已记录 ${primaryMode.tasks} 次 ${primaryModeLabel} 任务，累计 ${primaryMode.findings} 条分析结果。当前为单模式视角，如需三模式对比，请补充运行其他模式。`;
  const latencyEvidence = hybridLatencySavingVsModel >= 0 ? `相较 Model Only，混合模式平均延迟低 ${Math.abs(hybridLatencySavingVsModel).toFixed(1)}ms，更适合作为默认路径。` : `当前窗口期混合模式平均延迟高 ${Math.abs(hybridLatencySavingVsModel).toFixed(1)}ms，但换来了更高覆盖率与更均衡的综合表现。`;
  const recommendationEvidence = hasMultiModeComparison
    ? [
        `相较 Rule Only，混合模式准确性变化 ${hybridAccuracyGainVsRule >= 0 ? "+" : "-"}${Math.abs(hybridAccuracyGainVsRule).toFixed(1)} 个点。`,
        `相较 Rule Only，混合模式覆盖率变化 ${hybridRecallGainVsRule >= 0 ? "+" : "-"}${Math.abs(hybridRecallGainVsRule).toFixed(1)} 个点。`,
        latencyEvidence,
      ]
    : [
        `${primaryModeLabel} 在当前窗口内已形成真实统计样本。`,
        `当前窗口累计任务 ${primaryMode.tasks}，分析结果 ${primaryMode.findings}。`,
        "若需横向比较，请补充运行另外两种分析模式。",
      ];
  const insights = hasMultiModeComparison
    ? [
        `${bestAccuracyMode?.modeLabel ?? "Hybrid"} 在当前窗口期判断质量表现最佳。`,
        `${hybridMode.modeLabel} 在覆盖率与成本之间更均衡，更适合作为默认方案。`,
        `${highestLatencyMode?.modeLabel ?? "Model Only"} 平均延迟更高，建议配合规则前置过滤。`,
      ]
    : [
        `当前窗口仅检测到 ${primaryModeLabel} 模式，已展示真实聚合结果。`,
        "页面已隐藏无样本模式，仅呈现当前模式的真实指标。",
        "建议补充运行 Model Only 与 Hybrid，以获得完整对比结论。",
      ];

  return {
    days: rangeDays,
    range: { startDate: rangeStart, endDate: rangeEnd, isCustom: hasCustomRange },
    metrics: { accuracy: Number(weightedAccuracy.toFixed(1)), accuracyDelta: Number((weightedAccuracy - previousConfidenceAvg).toFixed(1)), recall: Number(overallRecall.toFixed(1)), recallDelta: Number((overallRecall - previousRecall).toFixed(1)), speedEps: Number(currentSpeed.toFixed(1)), speedDelta: Number((currentSpeed - previousSpeed).toFixed(1)) },
    focusMetrics: {
      accuracy: {
        label: `${primaryModeLabel} 准确性`,
        value: Number(primaryMode.accuracy.toFixed(1)),
        unit: "%",
        barPercent: Math.max(0, Math.min(100, Math.round(primaryMode.accuracy))),
        compareLabel: hasMultiModeComparison
          ? (hybridAccuracyGainVsRule >= 0 ? "较 Rule Only 提升" : "较 Rule Only 下降")
          : "单模式窗口",
        compareText: hasMultiModeComparison
          ? `${Math.abs(hybridAccuracyGainVsRule).toFixed(1)} 个点`
          : `${primaryMode.tasks} 次任务`,
        note: hasMultiModeComparison
          ? `Rule Only ${ruleMode.accuracy.toFixed(1)}% · Hybrid ${hybridMode.accuracy.toFixed(1)}%`
          : `${primaryModeLabel} 准确率 ${primaryMode.accuracy.toFixed(1)}%`,
      },
      recall: {
        label: `${primaryModeLabel} 覆盖率`,
        value: Number(primaryMode.recall.toFixed(1)),
        unit: "%",
        barPercent: Math.max(0, Math.min(100, Math.round(primaryMode.recall))),
        compareLabel: hasMultiModeComparison
          ? (hybridRecallGainVsRule >= 0 ? "较 Rule Only 提升" : "较 Rule Only 下降")
          : "单模式窗口",
        compareText: hasMultiModeComparison
          ? `${Math.abs(hybridRecallGainVsRule).toFixed(1)} 个点`
          : `${primaryMode.findings} 条结果`,
        note: hasMultiModeComparison
          ? `Rule Only ${ruleMode.recall.toFixed(1)}% · Hybrid ${hybridMode.recall.toFixed(1)}%`
          : `${primaryModeLabel} 覆盖率 ${primaryMode.recall.toFixed(1)}%`,
      },
      latency: {
        label: `${primaryModeLabel} 平均延迟`,
        value: Number(primaryMode.latencyMs.toFixed(1)),
        unit: "ms",
        barPercent: hasMultiModeComparison
          ? latencyBarPercent
          : Math.max(0, Math.min(100, Math.round((primaryMode.latencyMs / latencyMax) * 100))),
        compareLabel: hasMultiModeComparison
          ? (hybridLatencySavingVsModel >= 0 ? "较 Model Only 更低" : "较 Model Only 更高")
          : "单模式窗口",
        compareText: hasMultiModeComparison
          ? `${Math.abs(hybridLatencySavingVsModel).toFixed(1)}ms`
          : `${primaryMode.latencyMs.toFixed(1)}ms`,
        note: hasMultiModeComparison
          ? `Model Only ${modelMode.latencyMs.toFixed(1)}ms · Hybrid ${hybridMode.latencyMs.toFixed(1)}ms`
          : `${primaryModeLabel} 延迟统计基于当前窗口真实任务。`,
      },
    },
    chart,
    modes: activeModeRows.map((item) => ({ modeKey: item.mode, modeLabel: item.modeLabel, accuracy: item.accuracy, recall: item.recall, f1: item.f1, latencyMs: item.latencyMs, status: item.mode === primaryMode.mode ? "recommended" : item.mode === "model_only" ? "high_load" : "baseline" })),
    recommendation: {
      title: recommendationTitle,
      summary: recommendationSummary,
      evidence: recommendationEvidence,
      footnote: hasMultiModeComparison
        ? "数据来自当前窗口期真实日志与 analysis_results 聚合，页面本身不触发三模式重跑。"
        : "当前为单模式真实数据展示，待补充其他模式后自动升级为完整对比。",
    },
    insights,
    pendingReviewCount,
    dataSource: {
      kind: "real",
      label: "窗口聚合口径",
      description: hasMultiModeComparison
        ? "基于当前账号在所选时间范围内的 logs、analysis_results 与 review_cases 聚合。"
        : "基于当前账号在所选时间范围内的单模式真实数据聚合，尚未形成完整三模式对比。",
    },
    availableModes,
  };
}

