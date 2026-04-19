import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";

export type IncidentRow = {
  id: string;
  title: string;
  sourceLog: string;
  type: string;
  riskLabel: string;
  stageLabel: string;
  suggestion: string;
  snippet: string;
};

export type IncidentTrendItem = {
  label: string;
  count: number;
  heightPercent: number;
};

export type ReviewEfficiency = {
  todayReviewed: number;
  todayTotal: number;
  percent: number;
};

export type IncidentsPageData = {
  rows: IncidentRow[];
  suggestionTrend: IncidentTrendItem[];
  reviewEfficiency: ReviewEfficiency;
};

const EMPTY_INCIDENTS_DATA: IncidentsPageData = {
  rows: [],
  suggestionTrend: [],
  reviewEfficiency: {
    todayReviewed: 0,
    todayTotal: 0,
    percent: 0,
  },
};

function toRiskLabel(value: string | null | undefined) {
  if (value === "high") return "高风险";
  if (value === "medium") return "中风险";
  if (value === "low") return "低风险";
  return "中风险";
}

function toIssueDisplayName(value: string | null | undefined) {
  return toIssueTypeDisplayName(value);
}

export async function getIncidentsPageData(): Promise<IncidentsPageData> {
  if (!hasSupabaseEnv()) {
    return EMPTY_INCIDENTS_DATA;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_INCIDENTS_DATA;
  }

  const [errorsResult, logsResult, analysesResult] = await Promise.all([
    supabase
      .from("log_errors")
      .select("id, log_id, error_type, raw_text, review_status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("logs").select("id, file_name").eq("user_id", user.id).limit(200),
    supabase
      .from("analysis_results")
      .select("log_error_id, risk_level, repair_suggestion")
      .eq("user_id", user.id)
      .limit(400),
  ]);

  const logNameById = new Map<string, string>();
  for (const item of logsResult.data ?? []) {
    logNameById.set(item.id, item.file_name ?? "未知日志");
  }

  const analysisByErrorId = new Map<string, { risk_level: string | null; repair_suggestion: string | null }>();
  for (const item of analysesResult.data ?? []) {
    analysisByErrorId.set(item.log_error_id, {
      risk_level: item.risk_level,
      repair_suggestion: item.repair_suggestion,
    });
  }

  const now = new Date();
  const trendDays = Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - index));
    const count = (analysesResult.data ?? []).filter((item) => String(item.repair_suggestion ?? "").trim()).length;
    return {
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      count,
    };
  });

  const maxTrendCount = Math.max(...trendDays.map((item) => item.count), 1);
  const suggestionTrend = trendDays.map((item) => ({
    label: item.label,
    count: item.count,
    heightPercent: Math.max(12, Math.round((item.count / maxTrendCount) * 100)),
  }));

  let todayReviewed = 0;
  let todayTotal = 0;
  for (const item of errorsResult.data ?? []) {
    todayTotal += 1;
    if (item.review_status === "completed") {
      todayReviewed += 1;
    }
  }

  return {
    rows: (errorsResult.data ?? []).map((item) => {
      const analysis = analysisByErrorId.get(item.id);
      const reviewStatus = item.review_status ?? "pending";
      const stageLabel = reviewStatus === "completed" ? "已完成" : reviewStatus === "skipped" ? "已跳过" : "待复核";

      return {
        id: item.id,
        title: toIssueDisplayName(item.error_type),
        sourceLog: logNameById.get(item.log_id) ?? "未知日志",
        type: toIssueDisplayName(item.error_type),
        riskLabel: toRiskLabel(analysis?.risk_level ?? "medium"),
        stageLabel,
        suggestion: analysis?.repair_suggestion ?? "建议进入人工复核后确认处理方案。",
        snippet: item.raw_text ?? "",
      };
    }),
    suggestionTrend,
    reviewEfficiency: {
      todayReviewed,
      todayTotal,
      percent: todayTotal > 0 ? Math.round((todayReviewed / todayTotal) * 100) : 0,
    },
  };
}
