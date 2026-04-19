import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";

export type HistoryCaseRow = {
  id: string;
  incidentId: string;
  title: string;
  sourceLog: string;
  typeLabel: string;
  riskLabel: string;
  reviewStatus: string;
  reviewStatusLabel: string;
  updatedAt: string;
  snippet: string;
  confidence: number;
  cause: string;
  suggestion: string;
  logId: string;
};

export type HistoricalMissedOpsSummary = {
  pendingReviews: number;
  completedReviews: number;
  backfillEligibleReviews: number;
  historicalMissedTotal: number;
  verifiedHistoricalMissedTotal: number;
};

export type HistoricalMissedBackfillRow = {
  id: string;
  title: string;
  sourceLog: string;
  updatedAt: string;
  reason: string;
};

export type HistoricalMissedRecentRow = {
  id: string;
  title: string;
  errorType: string;
  sourceType: string;
  updatedAt: string;
  verified: boolean;
  priority: number;
};

export type HistoryCasesPageData = {
  rows: HistoryCaseRow[];
  summary: {
    total: number;
    reviewed: number;
    archived: number;
    highRisk: number;
    knowledgeTemplateCount: number;
  };
  historicalMissedOps: HistoricalMissedOpsSummary;
  recentHistoricalMissedCases: HistoricalMissedRecentRow[];
  recentBackfillCases: HistoricalMissedBackfillRow[];
};

const EMPTY_DATA: HistoryCasesPageData = {
  rows: [],
  summary: {
    total: 0,
    reviewed: 0,
    archived: 0,
    highRisk: 0,
    knowledgeTemplateCount: 0,
  },
  historicalMissedOps: {
    pendingReviews: 0,
    completedReviews: 0,
    backfillEligibleReviews: 0,
    historicalMissedTotal: 0,
    verifiedHistoricalMissedTotal: 0,
  },
  recentHistoricalMissedCases: [],
  recentBackfillCases: [],
};

function toIssueDisplayName(value: string | null | undefined) {
  return toIssueTypeDisplayName(value);
}

function toRiskLabel(value: string | null | undefined) {
  if (value === "high") return "高风险";
  if (value === "medium") return "中风险";
  if (value === "low") return "低风险";
  return "中风险";
}

function toRiskWeight(value: string | null | undefined) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 2;
}

function toReviewStatusLabel(value: string | null | undefined) {
  if (value === "completed") return "已复盘";
  if (value === "skipped") return "已跳过";
  if (value === "archived") return "已归档";
  return "待沉淀";
}

function asIsoDate(value: string | null | undefined) {
  return value ?? new Date(0).toISOString();
}

export async function getHistoryCasesPageData(): Promise<HistoryCasesPageData> {
  if (!hasSupabaseEnv()) {
    return EMPTY_DATA;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_DATA;
  }

  const [
    reviewRowsResult,
    knowledgeCountResult,
    pendingReviewCountResult,
    completedReviewRowsResult,
    historicalMissedRowsResult,
    historicalMissedCountResult,
    historicalMissedVerifiedCountResult,
  ] = await Promise.all([
    supabase
      .from("review_cases")
      .select("id, log_error_id, review_status, final_risk_level, final_error_type, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(300),
    supabase.from("knowledge_base").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("review_cases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("review_status", "pending"),
    supabase
      .from("review_cases")
      .select("id, log_error_id, final_error_type, final_cause, resolution, review_note, updated_at")
      .eq("user_id", user.id)
      .eq("review_status", "completed")
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase
      .from("historical_missed_cases")
      .select("id, title, error_type, source_type, updated_at, verified, priority")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("historical_missed_cases")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null),
    supabase
      .from("historical_missed_cases")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null)
      .eq("verified", true),
  ]);

  const reviewRows = (reviewRowsResult.data ?? []).filter((item) => item.review_status !== "pending");
  const reviewErrorIds = Array.from(
    new Set(
      reviewRows
        .map((item) => item.log_error_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );

  const [errorsResult, analysesResult] = await Promise.all([
    reviewErrorIds.length > 0
      ? supabase.from("log_errors").select("id, log_id, error_type, raw_text").eq("user_id", user.id).in("id", reviewErrorIds)
      : Promise.resolve({ data: [] as Array<{ id: string; log_id: string | null; error_type: string | null; raw_text: string | null }> }),
    reviewErrorIds.length > 0
      ? supabase.from("analysis_results").select("log_error_id, risk_level, confidence, cause, repair_suggestion").eq("user_id", user.id).in("log_error_id", reviewErrorIds)
      : Promise.resolve({ data: [] as Array<{ log_error_id: string; risk_level: string | null; confidence: number | null; cause: string | null; repair_suggestion: string | null }> }),
  ]);

  const relatedLogIds = Array.from(
    new Set(
      (errorsResult.data ?? [])
        .map((item) => item.log_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );

  const logsResult = relatedLogIds.length > 0
    ? await supabase.from("logs").select("id, file_name").eq("user_id", user.id).in("id", relatedLogIds)
    : { data: [] as Array<{ id: string; file_name: string | null }> };

  const errorById = new Map<string, { log_id: string | null; error_type: string | null; raw_text: string | null }>();
  for (const item of errorsResult.data ?? []) {
    errorById.set(item.id, item);
  }

  const logById = new Map<string, string>();
  for (const item of logsResult.data ?? []) {
    logById.set(item.id, item.file_name ?? "未知日志");
  }

  const analysisByErrorId = new Map<string, { risk_level: string | null; confidence: number | null; cause: string | null; repair_suggestion: string | null }>();
  for (const item of analysesResult.data ?? []) {
    const current = analysisByErrorId.get(item.log_error_id);
    if (!current || toRiskWeight(item.risk_level) >= toRiskWeight(current.risk_level)) {
      analysisByErrorId.set(item.log_error_id, item);
    }
  }

  const completedReviewRows = completedReviewRowsResult.data ?? [];
  const completedReviewErrorIds = Array.from(
    new Set(
      completedReviewRows
        .map((item) => item.log_error_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );

  const completedAnalysisRowsResult =
    completedReviewErrorIds.length > 0
      ? await supabase
          .from("analysis_results")
          .select("log_error_id, cause, repair_suggestion, created_at")
          .eq("user_id", user.id)
          .in("log_error_id", completedReviewErrorIds)
          .order("created_at", { ascending: false })
          .limit(500)
      : { data: [] as Array<{ log_error_id: string; cause: string | null; repair_suggestion: string | null; created_at: string | null }> };

  const latestCompletedAnalysisByErrorId = new Map<string, { cause: string | null; repair_suggestion: string | null; created_at: string | null }>();
  for (const item of completedAnalysisRowsResult.data ?? []) {
    if (!latestCompletedAnalysisByErrorId.has(item.log_error_id)) {
      latestCompletedAnalysisByErrorId.set(item.log_error_id, item);
    }
  }

  const backfillEligibleReviews = completedReviewRows.reduce((total, item) => {
    const analysis = item.log_error_id ? latestCompletedAnalysisByErrorId.get(item.log_error_id) : null;
    const eligible =
      String(item.final_cause ?? "").trim().length > 0 ||
      String(item.resolution ?? "").trim().length > 0 ||
      String(item.review_note ?? "").trim().length > 0 ||
      String(analysis?.cause ?? "").trim().length > 0 ||
      String(analysis?.repair_suggestion ?? "").trim().length > 0;

    return total + (eligible ? 1 : 0);
  }, 0);

  const rows: HistoryCaseRow[] = reviewRows.map((item) => {
    const error = errorById.get(item.log_error_id);
    const analysis = analysisByErrorId.get(item.log_error_id);
    const logId = error?.log_id ?? "";
    const fallbackRisk = analysis?.risk_level ?? "medium";
    const typeLabel = toIssueDisplayName(item.final_error_type ?? error?.error_type ?? "未知问题");

    return {
      id: item.id,
      incidentId: item.log_error_id,
      title: typeLabel,
      sourceLog: logById.get(logId) ?? "未知日志",
      typeLabel,
      riskLabel: toRiskLabel(item.final_risk_level ?? fallbackRisk),
      reviewStatus: item.review_status,
      reviewStatusLabel: toReviewStatusLabel(item.review_status),
      updatedAt: asIsoDate(item.updated_at),
      snippet: error?.raw_text ?? "",
      confidence: Number(analysis?.confidence ?? 0),
      cause: analysis?.cause ?? "暂无分析结论，建议结合原始日志与上下游调用链进行人工确认。",
      suggestion: analysis?.repair_suggestion ?? "建议先执行保守处置策略，再补充规则并跟踪后续趋势。",
      logId,
    };
  });

  const recentBackfillCases = completedReviewRows
    .map((item) => {
      const analysis = item.log_error_id ? latestCompletedAnalysisByErrorId.get(item.log_error_id) : null;
      const error = item.log_error_id ? errorById.get(item.log_error_id) : null;
      const eligibleReasons = [
        String(item.final_cause ?? "").trim(),
        String(item.resolution ?? "").trim(),
        String(item.review_note ?? "").trim(),
        String(analysis?.cause ?? "").trim(),
        String(analysis?.repair_suggestion ?? "").trim(),
      ].filter(Boolean);

      if (eligibleReasons.length === 0) {
        return null;
      }

      return {
        id: item.log_error_id,
        title: toIssueDisplayName(item.final_error_type ?? error?.error_type ?? "未知问题"),
        sourceLog: logById.get(error?.log_id ?? "") ?? "未知日志",
        updatedAt: asIsoDate(item.updated_at),
        reason: eligibleReasons[0] ?? "可回补",
      } satisfies HistoricalMissedBackfillRow;
    })
    .filter((item): item is HistoricalMissedBackfillRow => Boolean(item))
    .slice(0, 3);

  return {
    rows,
    summary: {
      total: rows.length,
      reviewed: rows.filter((item) => item.reviewStatusLabel === "已复盘").length,
      archived: rows.filter((item) => item.reviewStatusLabel === "已归档" || item.reviewStatusLabel === "已跳过").length,
      highRisk: rows.filter((item) => item.riskLabel === "高风险").length,
      knowledgeTemplateCount: knowledgeCountResult.count ?? 0,
    },
    historicalMissedOps: {
      pendingReviews: pendingReviewCountResult.count ?? 0,
      completedReviews: completedReviewRows.length,
      backfillEligibleReviews,
      historicalMissedTotal: historicalMissedCountResult.count ?? 0,
      verifiedHistoricalMissedTotal: historicalMissedVerifiedCountResult.count ?? 0,
    },
    recentHistoricalMissedCases: (historicalMissedRowsResult.data ?? []).map((item) => ({
      id: String(item.id),
      title: String(item.title ?? "未命名漏报案例").trim(),
      errorType: String(item.error_type ?? "unknown_error").trim(),
      sourceType: String(item.source_type ?? "custom").trim(),
      updatedAt: asIsoDate(item.updated_at),
      verified: item.verified === true,
      priority: Number(item.priority ?? 120),
    })),
    recentBackfillCases,
  };
}
