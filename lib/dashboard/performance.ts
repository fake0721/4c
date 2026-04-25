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

function toModeLabel(value: "rule_only" | "model_only" | "hybrid") {
  if (value === "rule_only") return "Rule Only";
  if (value === "model_only") return "Model Only";
  return "Hybrid";
}

const FIGURE_TWO_PERFORMANCE_VALUES = {
  accuracy: {
    rule_only: 84.3,
    model_only: 90.6,
    hybrid: 92.4,
  },
  recall: {
    rule_only: 74.2,
    model_only: 81.5,
    hybrid: 88.7,
  },
  throughput: {
    rule_only: 100.0,
    model_only: 63.4,
    hybrid: 86.9,
  },
  resource: {
    rule_only: 35.5,
    model_only: 100.0,
    hybrid: 70.9,
  },
} as const;

function buildFigureTwoPerformanceData(
  days: number,
  startDate: string,
  endDate: string,
  isCustom: boolean,
  pendingReviewCount = 0,
): PerformancePageData {
  const availableModes: Array<"rule_only" | "model_only" | "hybrid"> = [
    "rule_only",
    "model_only",
    "hybrid",
  ];

  const modes: PerformanceModeRow[] = [
    {
      modeKey: "rule_only",
      modeLabel: toModeLabel("rule_only"),
      accuracy: FIGURE_TWO_PERFORMANCE_VALUES.accuracy.rule_only,
      recall: FIGURE_TWO_PERFORMANCE_VALUES.recall.rule_only,
      f1: 0.783,
      latencyMs: FIGURE_TWO_PERFORMANCE_VALUES.resource.rule_only,
      status: "baseline",
    },
    {
      modeKey: "model_only",
      modeLabel: toModeLabel("model_only"),
      accuracy: FIGURE_TWO_PERFORMANCE_VALUES.accuracy.model_only,
      recall: FIGURE_TWO_PERFORMANCE_VALUES.recall.model_only,
      f1: 0.859,
      latencyMs: FIGURE_TWO_PERFORMANCE_VALUES.resource.model_only,
      status: "high_load",
    },
    {
      modeKey: "hybrid",
      modeLabel: toModeLabel("hybrid"),
      accuracy: FIGURE_TWO_PERFORMANCE_VALUES.accuracy.hybrid,
      recall: FIGURE_TWO_PERFORMANCE_VALUES.recall.hybrid,
      f1: 0.906,
      latencyMs: FIGURE_TWO_PERFORMANCE_VALUES.resource.hybrid,
      status: "recommended",
    },
  ];

  const averageAccuracy =
    (FIGURE_TWO_PERFORMANCE_VALUES.accuracy.rule_only +
      FIGURE_TWO_PERFORMANCE_VALUES.accuracy.model_only +
      FIGURE_TWO_PERFORMANCE_VALUES.accuracy.hybrid) /
    3;
  const averageRecall =
    (FIGURE_TWO_PERFORMANCE_VALUES.recall.rule_only +
      FIGURE_TWO_PERFORMANCE_VALUES.recall.model_only +
      FIGURE_TWO_PERFORMANCE_VALUES.recall.hybrid) /
    3;
  const averageThroughput =
    (FIGURE_TWO_PERFORMANCE_VALUES.throughput.rule_only +
      FIGURE_TWO_PERFORMANCE_VALUES.throughput.model_only +
      FIGURE_TWO_PERFORMANCE_VALUES.throughput.hybrid) /
    3;

  const chart: PerformanceChartRow[] = [
    {
      label: "准确率",
      ruleOnly: FIGURE_TWO_PERFORMANCE_VALUES.accuracy.rule_only,
      modelOnly: FIGURE_TWO_PERFORMANCE_VALUES.accuracy.model_only,
      hybrid: FIGURE_TWO_PERFORMANCE_VALUES.accuracy.hybrid,
    },
    {
      label: "召回率",
      ruleOnly: FIGURE_TWO_PERFORMANCE_VALUES.recall.rule_only,
      modelOnly: FIGURE_TWO_PERFORMANCE_VALUES.recall.model_only,
      hybrid: FIGURE_TWO_PERFORMANCE_VALUES.recall.hybrid,
    },
    {
      label: "吞吐量",
      ruleOnly: FIGURE_TWO_PERFORMANCE_VALUES.throughput.rule_only,
      modelOnly: FIGURE_TWO_PERFORMANCE_VALUES.throughput.model_only,
      hybrid: FIGURE_TWO_PERFORMANCE_VALUES.throughput.hybrid,
    },
    {
      label: "资源消耗",
      ruleOnly: FIGURE_TWO_PERFORMANCE_VALUES.resource.rule_only,
      modelOnly: FIGURE_TWO_PERFORMANCE_VALUES.resource.model_only,
      hybrid: FIGURE_TWO_PERFORMANCE_VALUES.resource.hybrid,
    },
  ];

  return {
    days,
    range: { startDate, endDate, isCustom },
    metrics: {
      accuracy: Number(averageAccuracy.toFixed(1)),
      accuracyDelta: 0,
      recall: Number(averageRecall.toFixed(1)),
      recallDelta: 0,
      speedEps: Number((averageThroughput / 5).toFixed(1)),
      speedDelta: 0,
    },
    focusMetrics: {
      accuracy: {
        label: "混合模式准确性",
        value: FIGURE_TWO_PERFORMANCE_VALUES.accuracy.hybrid,
        unit: "%",
        barPercent: Math.round(FIGURE_TWO_PERFORMANCE_VALUES.accuracy.hybrid),
        compareLabel: "3模式对比",
        compareText: "92.4%",
        note: "以图二数据作为当前窗口对比口径。",
      },
      recall: {
        label: "混合模式覆盖率",
        value: FIGURE_TWO_PERFORMANCE_VALUES.recall.hybrid,
        unit: "%",
        barPercent: Math.round(FIGURE_TWO_PERFORMANCE_VALUES.recall.hybrid),
        compareLabel: "3模式对比",
        compareText: "88.7%",
        note: "以图二数据作为当前窗口对比口径。",
      },
      latency: {
        label: "混合模式平均延迟",
        value: FIGURE_TWO_PERFORMANCE_VALUES.resource.hybrid,
        unit: "ms",
        barPercent: Math.round(FIGURE_TWO_PERFORMANCE_VALUES.resource.hybrid),
        compareLabel: "3模式对比",
        compareText: "70.9ms",
        note: "以图二数据作为当前窗口对比口径。",
      },
    },
    chart,
    modes,
    recommendation: {
      title: "默认推荐：Hybrid",
      summary: "按图二数据口径，Hybrid 在准确率与召回率上最高，作为默认方案更合适。",
      evidence: [
        "Rule Only 准确率 84.3%，召回率 74.2%。",
        "Model Only 准确率 90.6%，召回率 81.5%。",
        "Hybrid 准确率 92.4%，召回率 88.7%，综合表现最优。",
      ],
      footnote: "",
    },
    insights: [
      "Hybrid 的综合表现最好，适合作为默认模式。",
      "Model Only 的资源消耗最高。",
      "Rule Only 吞吐量最高，但准确率与召回率低于 Hybrid。",
    ],
    pendingReviewCount,
    dataSource: {
      kind: "demo",
      label: "图二演示数据",
      description: "当前页面已恢复为原来的固定虚拟数据展示口径。",
    },
    availableModes,
  };
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
  const hasCustomRange =
    isValidDateInput.test(startDateParam) && isValidDateInput.test(endDateParam);

  const now = new Date();
  let currentStart: Date;
  let currentEndExclusive: Date;
  let rangeDays = 7;

  if (hasCustomRange) {
    const customStart = new Date(`${startDateParam}T00:00:00.000Z`);
    const customEndExclusive = new Date(`${endDateParam}T00:00:00.000Z`);
    customEndExclusive.setUTCDate(customEndExclusive.getUTCDate() + 1);

    if (
      Number.isFinite(customStart.getTime()) &&
      Number.isFinite(customEndExclusive.getTime()) &&
      customStart < customEndExclusive
    ) {
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
  const rangeEnd = new Date(currentEndExclusive.getTime() - 1000)
    .toISOString()
    .slice(0, 10);

  let pendingReviewCount = 0;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { count } = await supabase
        .from("review_cases")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("review_status", "pending");

      pendingReviewCount = count ?? 0;
    }
  }

  return buildFigureTwoPerformanceData(
    rangeDays,
    rangeStart,
    rangeEnd,
    hasCustomRange,
    pendingReviewCount,
  );
}
