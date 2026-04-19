import type { SupabaseClient } from "@supabase/supabase-js";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";
import { buildEmbeddingInput, embedText, hasEmbeddingConfig } from "@/lib/llm/embeddings";

function getFirstNonEmptyValue(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function normalizeClusterSegment(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function buildClusterKey(params: {
  sourceType: string;
  errorType: string;
  rootCause: string;
  solution: string;
  logExcerpt: string;
}) {
  const discriminator =
    normalizeClusterSegment(params.rootCause) ||
    normalizeClusterSegment(params.solution) ||
    normalizeClusterSegment(params.logExcerpt);

  return [
    "historical_missed",
    normalizeClusterSegment(params.sourceType) || "custom",
    normalizeClusterSegment(params.errorType) || "unknown_error",
    discriminator || "general",
  ].join("::");
}

function buildKeywords(params: {
  errorType: string;
  sourceType: string;
  rootCause: string;
  solution: string;
}) {
  return Array.from(
    new Set(
      [
        params.errorType,
        params.sourceType,
        "manual_review",
        "historical_missed",
        ...normalizeClusterSegment(params.rootCause).split(" "),
        ...normalizeClusterSegment(params.solution).split(" "),
      ].filter(Boolean),
    ),
  ).join(",");
}

export async function syncHistoricalMissedCase(params: {
  supabase: SupabaseClient;
  logErrorId: string;
  errorType: string | null | undefined;
  rootCause: string | null | undefined;
  solution: string | null | undefined;
}) {
  const rootCause = String(params.rootCause ?? "").trim();
  const solution = String(params.solution ?? "").trim();
  const errorType = String(params.errorType ?? "").trim() || "unknown_error";

  if (!params.logErrorId || (!rootCause && !solution)) {
    return;
  }

  const { data: logError, error: logErrorError } = await params.supabase
    .from("log_errors")
    .select("id, log_id, raw_text, error_type")
    .eq("id", params.logErrorId)
    .maybeSingle();

  if (logErrorError || !logError) {
    return;
  }

  const { data: logRow, error: logRowError } = await params.supabase
    .from("logs")
    .select("id, source_type")
    .eq("id", logError.log_id)
    .maybeSingle();

  if (logRowError || !logRow) {
    return;
  }

  const sourceType = String(logRow.source_type ?? "custom").trim() || "custom";
  const logExcerpt = String(logError.raw_text ?? "").trim().slice(0, 500);
  const errorDisplay = toIssueTypeDisplayName(errorType);
  const title = `人工复核漏报案例 - ${errorDisplay} - ${sourceType}`;
  const clusterKey = buildClusterKey({
    sourceType,
    errorType,
    rootCause,
    solution,
    logExcerpt,
  });
  const keywords = buildKeywords({ errorType, sourceType, rootCause, solution });
  const updatedAt = new Date().toISOString();
  const embeddingInput = buildEmbeddingInput(
    [title, errorType, keywords, logExcerpt, rootCause, solution, sourceType],
    { maxLength: 2000 },
  );
  const embedding = hasEmbeddingConfig() ? await embedText(embeddingInput) : null;

  const payload = {
    title,
    error_type: errorType,
    source_type: sourceType,
    keywords,
    log_excerpt: logExcerpt || null,
    symptom: logExcerpt || null,
    root_cause: rootCause || null,
    solution: solution || null,
    repair_suggestion: solution || null,
    source: "manual_review_confirmed",
    verified: true,
    updated_at: updatedAt,
    cluster_key: clusterKey,
    priority: 120,
    embedding: embedding ?? undefined,
  };

  await params.supabase.from("historical_missed_cases").upsert(payload, {
    onConflict: "cluster_key",
    ignoreDuplicates: false,
  });
}

async function getLatestAnalysisForLogError(params: {
  supabase: SupabaseClient;
  logErrorId: string;
}) {
  const { data, error } = await params.supabase
    .from("analysis_results")
    .select("cause, repair_suggestion, created_at")
    .eq("log_error_id", params.logErrorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function syncHistoricalMissedCaseFromReviewCase(params: {
  supabase: SupabaseClient;
  reviewCaseId: string;
  fallbackErrorType?: string | null | undefined;
}) {
  const reviewCaseId = String(params.reviewCaseId ?? "").trim();
  if (!reviewCaseId) {
    return false;
  }

  const { data: reviewCase, error: reviewCaseError } = await params.supabase
    .from("review_cases")
    .select("id, log_error_id, review_status, final_error_type, final_cause, resolution, review_note")
    .eq("id", reviewCaseId)
    .maybeSingle();

  if (reviewCaseError || !reviewCase || reviewCase.review_status !== "completed" || !reviewCase.log_error_id) {
    return false;
  }

  const latestAnalysis = await getLatestAnalysisForLogError({
    supabase: params.supabase,
    logErrorId: reviewCase.log_error_id,
  });

  const rootCause = getFirstNonEmptyValue(
    reviewCase.final_cause,
    reviewCase.review_note,
    latestAnalysis?.cause,
  );
  const solution = getFirstNonEmptyValue(
    reviewCase.resolution,
    latestAnalysis?.repair_suggestion,
  );
  const errorType = getFirstNonEmptyValue(
    reviewCase.final_error_type,
    params.fallbackErrorType,
  );

  if (!rootCause && !solution) {
    return false;
  }

  await syncHistoricalMissedCase({
    supabase: params.supabase,
    logErrorId: reviewCase.log_error_id,
    errorType,
    rootCause,
    solution,
  });

  return true;
}

export async function backfillHistoricalMissedCasesForUser(params: {
  supabase: SupabaseClient;
  userId: string;
  limit?: number | null;
}) {
  const userId = String(params.userId ?? "").trim();
  const limit = Math.min(Math.max(Number(params.limit ?? 100), 1), 500);

  if (!userId) {
    return {
      processed: 0,
      synced: 0,
    };
  }

  const { data: reviewCases, error: reviewCasesError } = await params.supabase
    .from("review_cases")
    .select("id")
    .eq("user_id", userId)
    .eq("review_status", "completed")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (reviewCasesError || !reviewCases) {
    return {
      processed: 0,
      synced: 0,
    };
  }

  let synced = 0;

  for (const reviewCase of reviewCases) {
    const didSync = await syncHistoricalMissedCaseFromReviewCase({
      supabase: params.supabase,
      reviewCaseId: String(reviewCase.id ?? ""),
    });

    if (didSync) {
      synced += 1;
    }
  }

  return {
    processed: reviewCases.length,
    synced,
  };
}
