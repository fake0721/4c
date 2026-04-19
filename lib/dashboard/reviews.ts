import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";

export type ReviewItem = {
  id: string;
  incidentId: string;
  title: string;
  sourceLog: string;
  issueTypeValue: string;
  riskLabel: string;
  riskValue: string;
  reviewStatus: string;
  updatedAt: string;
  snippet: string;
  confidence: number;
  cause: string;
  suggestion: string;
  reviewNote: string;
};

type ReviewAnalysis = {
  log_error_id: string;
  risk_level: string | null;
  confidence: number | null;
  cause: string | null;
  repair_suggestion: string | null;
};

export type ReviewsPageData = {
  queue: ReviewItem[];
  historyCases: ReviewItem[];
  pendingReviewCount: number;
};

const EMPTY_REVIEWS_DATA: ReviewsPageData = {
  queue: [],
  historyCases: [],
  pendingReviewCount: 0,
};

function asIsoDate(value: string | null | undefined) {
  return value ?? new Date(0).toISOString();
}

function toRiskLabel(value: string | null | undefined) {
  if (value === "high") return "高风险";
  if (value === "medium") return "中风险";
  if (value === "low") return "低风险";
  return "未知";
}

function toIssueDisplayName(value: string | null | undefined) {
  return toIssueTypeDisplayName(value);
}

function normalizeConfidence(value: number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toRiskWeight(value: string | null | undefined) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

export async function getReviewsPageData(): Promise<ReviewsPageData> {
  if (!hasSupabaseEnv()) {
    return EMPTY_REVIEWS_DATA;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_REVIEWS_DATA;
  }

  const { data: reviewRows } = await supabase
    .from("review_cases")
    .select("id, log_error_id, review_status, final_risk_level, final_error_type, review_note, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(300);

  const reviewErrorIds = Array.from(
    new Set(
      (reviewRows ?? [])
        .map((item) => item.log_error_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );

  const [errorsResult, analysesResult] = await Promise.all([
    reviewErrorIds.length > 0
      ? supabase
          .from("log_errors")
          .select("id, log_id, error_type, raw_text")
          .eq("user_id", user.id)
          .in("id", reviewErrorIds)
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            log_id: string | null;
            error_type: string | null;
            raw_text: string | null;
          }>,
        }),
    reviewErrorIds.length > 0
      ? supabase
          .from("analysis_results")
          .select("log_error_id, risk_level, confidence, cause, repair_suggestion")
          .eq("user_id", user.id)
          .in("log_error_id", reviewErrorIds)
      : Promise.resolve({ data: [] as ReviewAnalysis[] }),
  ]);

  const relatedLogIds = Array.from(
    new Set(
      (errorsResult.data ?? [])
        .map((item) => item.log_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );

  const logsResult =
    relatedLogIds.length > 0
      ? await supabase.from("logs").select("id, file_name").eq("user_id", user.id).in("id", relatedLogIds)
      : { data: [] as Array<{ id: string; file_name: string | null }> };

  const errorById = new Map((errorsResult.data ?? []).map((item) => [item.id, item]));
  const logById = new Map((logsResult.data ?? []).map((item) => [item.id, item.file_name ?? "未知日志"]));

  const analysisByErrorId = new Map<string, ReviewAnalysis>();
  for (const item of analysesResult.data ?? []) {
    const current = analysisByErrorId.get(item.log_error_id);
    if (!current) {
      analysisByErrorId.set(item.log_error_id, item);
      continue;
    }

    if (toRiskWeight(item.risk_level) >= toRiskWeight(current.risk_level)) {
      analysisByErrorId.set(item.log_error_id, item);
    }
  }

  const rows: ReviewItem[] = (reviewRows ?? []).map((item) => {
    const error = errorById.get(item.log_error_id);
    const analysis = analysisByErrorId.get(item.log_error_id);
    const logId = error?.log_id ?? "";
    const fallbackRisk = analysis?.risk_level ?? "medium";
    const issueTypeValue = item.final_error_type ?? error?.error_type ?? "UNKNOWN";
    const riskValue = item.final_risk_level ?? fallbackRisk;

    return {
      id: item.id,
      incidentId: item.log_error_id,
      title: toIssueDisplayName(issueTypeValue),
      sourceLog: logById.get(logId) ?? "未知日志",
      issueTypeValue,
      riskLabel: toRiskLabel(riskValue),
      riskValue,
      reviewStatus: item.review_status,
      updatedAt: asIsoDate(item.updated_at),
      snippet: error?.raw_text ?? "",
      confidence: normalizeConfidence(analysis?.confidence),
      cause: analysis?.cause ?? "暂无分析结论，建议结合原始日志与上下游调用链进行人工确认。",
      suggestion: analysis?.repair_suggestion ?? "建议先执行保守处置策略，再补充规则并跟踪后续趋势。",
      reviewNote: String(item.review_note ?? ""),
    };
  });

  return {
    queue: rows.filter((item) => item.reviewStatus === "pending"),
    historyCases: rows.filter((item) => item.reviewStatus !== "pending"),
    pendingReviewCount: rows.filter((item) => item.reviewStatus === "pending").length,
  };
}
