import { randomUUID } from "node:crypto";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  analyzeRepresentativeGroups,
  buildRepresentativeAnalysisPlan,
  buildReviewDecisions,
  createDualCheckReviewRows,
  type AnalysisMode,
} from "@/lib/analysis/orchestrator";
import { assertAnalysisModeReady } from "@/lib/llm/availability";
import { resolveKnowledgeBaseContext } from "@/lib/analysis/rag";
import { getDynamicDetectionRules } from "@/lib/rules/db-rules";
import { detectLogIncidents } from "@/lib/rules/engine";

const ENABLE_ANALYSIS_TRACE = process.env.ANALYSIS_TRACE === "1";

type PendingReviewRow = {
  log_error_id: string;
  log_id: string;
  user_id: string;
  final_error_type: string | null;
  final_risk_level: string | null;
  review_status: string;
  review_note: string | null;
};

type UploadLogInput = {
  supabase: SupabaseClient;
  user: User;
  file: File;
  sourceType: string;
  analysisMode?: string;
  selectedRuleIds?: string[];
  selectedKnowledgeIds?: string[];
  logBucket: string;
};

export type UploadLogResult = {
  logId: string;
  fileName: string;
  analysisMode: AnalysisMode;
  incidentsCount: number;
};

function traceAnalysisStage(stage: string, payload: Record<string, unknown>) {
  if (!ENABLE_ANALYSIS_TRACE) {
    return;
  }

  console.info("[analysis-trace]", {
    stage,
    at: new Date().toISOString(),
    ...payload,
  });
}

function countLines(text: string) {
  if (!text) {
    return 0;
  }

  return text.split(/\r\n|\r|\n/).length;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function createStoragePath(userId: string, fileName: string) {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${userId}/${year}/${month}/${randomUUID()}-${sanitizeFileName(fileName)}`;
}

function resolveAnalysisMode(requestedMode: string | undefined): AnalysisMode {
  if (requestedMode === "rule_only" || requestedMode === "model_only" || requestedMode === "hybrid") {
    return requestedMode;
  }

  // 系统默认模式：Hybrid
  return "hybrid";
}

function mergeReviewRows(
  baseRows: PendingReviewRow[],
  extraRows: PendingReviewRow[],
): PendingReviewRow[] {
  const rowsByErrorId = new Map<string, PendingReviewRow>();

  for (const row of baseRows) {
    rowsByErrorId.set(row.log_error_id, row);
  }

  for (const row of extraRows) {
    const existing = rowsByErrorId.get(row.log_error_id);

    if (!existing) {
      rowsByErrorId.set(row.log_error_id, row);
      continue;
    }

    rowsByErrorId.set(row.log_error_id, {
      ...existing,
      final_error_type: row.final_error_type ?? existing.final_error_type,
      final_risk_level: row.final_risk_level ?? existing.final_risk_level,
      review_status: row.review_status || existing.review_status,
      review_note: [existing.review_note, row.review_note].filter(Boolean).join(" | ") || null,
    });
  }

  return Array.from(rowsByErrorId.values());
}

export async function uploadAndAnalyzeLog({
  supabase,
  user,
  file,
  sourceType,
  analysisMode: requestedAnalysisMode,
  selectedRuleIds,
  selectedKnowledgeIds,
  logBucket,
}: UploadLogInput): Promise<UploadLogResult> {
  const workflowStartedAt = Date.now();

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please choose a log file first.");
  }

  let fileText = "";

  try {
    fileText = await file.text();
  } catch {
    throw new Error("Failed to read the uploaded file.");
  }

  traceAnalysisStage("file_read", {
    userId: user.id,
    fileName: file.name,
    fileSize: file.size,
    lineCount: countLines(fileText),
    elapsedMs: Date.now() - workflowStartedAt,
  });

  const lineCount = countLines(fileText);
  const storagePath = createStoragePath(user.id, file.name);

  const { error: uploadError } = await supabase.storage
    .from(logBucket)
    .upload(storagePath, file, {
      contentType: file.type || "text/plain",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      uploadError.message.includes("Bucket not found")
        ? `Storage bucket "${logBucket}" was not found. Create it in Supabase Storage first.`
        : uploadError.message,
    );
  }

  traceAnalysisStage("storage_upload", {
    userId: user.id,
    storagePath,
    elapsedMs: Date.now() - workflowStartedAt,
  });

  const storedFileText = fileText;
  const detectStartedAt = Date.now();
  const dynamicRules = await getDynamicDetectionRules();
  const hasRuleSelection = Array.isArray(selectedRuleIds);
  const selectedRuleSet = hasRuleSelection ? new Set(selectedRuleIds) : null;
  const selectedDynamicRules = !hasRuleSelection
    ? dynamicRules
    : dynamicRules.filter((rule) => selectedRuleSet?.has(rule.id));
  const selectedRuleCount = selectedRuleIds?.length ?? 0;
  const shouldFallbackToDefaultRules =
    dynamicRules.length === 0 ||
    (hasRuleSelection && selectedRuleCount > 0 && selectedDynamicRules.length === 0);
  const incidents = detectLogIncidents(storedFileText, sourceType, selectedDynamicRules, {
    includeDefaultRules: shouldFallbackToDefaultRules,
  });
  const analysisMode = resolveAnalysisMode(requestedAnalysisMode);
  assertAnalysisModeReady(analysisMode);

  traceAnalysisStage("rule_detection", {
    userId: user.id,
    sourceType,
    incidentCount: incidents.length,
    selectedRuleCount: selectedDynamicRules.length,
    selectedRuleInputCount: selectedRuleCount,
    fallbackToDefaultRules: shouldFallbackToDefaultRules,
    analysisMode,
    elapsedMs: Date.now() - detectStartedAt,
    totalElapsedMs: Date.now() - workflowStartedAt,
  });

  const { data: logRecord, error: logInsertError } = await supabase
    .from("logs")
    .insert({
      user_id: user.id,
      file_name: file.name,
      file_type: file.type || "text/plain",
      source_type: sourceType,
      storage_path: storagePath,
      file_size: file.size,
      line_count: lineCount,
      analysis_mode: analysisMode,
      status: "processing",
    })
    .select("id")
    .single();

  if (logInsertError || !logRecord) {
    throw new Error(logInsertError?.message ?? "Failed to create log record.");
  }

  traceAnalysisStage("log_created", {
    userId: user.id,
    logId: logRecord.id,
    elapsedMs: Date.now() - workflowStartedAt,
  });

  try {
    if (incidents.length > 0) {
      const { data: insertedIncidents, error: incidentsError } = await supabase
        .from("log_errors")
        .insert(
          incidents.map((incident) => ({
            log_id: logRecord.id,
            user_id: user.id,
            raw_text: incident.rawText,
            error_type: incident.errorType,
            detected_by: "rule",
            line_number: incident.lineNumber,
            is_uncertain: false,
            review_status: "pending",
          })),
        )
        .select("id, raw_text, error_type, line_number");

      if (incidentsError || !insertedIncidents) {
        throw new Error(incidentsError?.message ?? "Failed to write detected incidents.");
      }

      traceAnalysisStage("incidents_inserted", {
        logId: logRecord.id,
        insertedCount: insertedIncidents.length,
        totalElapsedMs: Date.now() - workflowStartedAt,
      });

      const { groups, representativeInputs, llmIndexes, ruleOnlyIndexes } =
        buildRepresentativeAnalysisPlan({
          incidents,
          sourceType,
          logContent: storedFileText,
          analysisMode,
        });

      const representativeResults = await analyzeRepresentativeGroups({
        inputs: representativeInputs,
        llmIndexes,
        ruleOnlyIndexes,
        resolveRagContext:
          analysisMode === "model_only"
            ? async () => []
            : (input) =>
                resolveKnowledgeBaseContext(input, {
                  selectedKnowledgeIds,
                }),
      });

      traceAnalysisStage("analysis_completed", {
        logId: logRecord.id,
        groupCount: groups.length,
        llmGroupCount: llmIndexes.length,
        ruleOnlyGroupCount: ruleOnlyIndexes.length,
        analyzedGroupCount: representativeResults.size,
        totalElapsedMs: Date.now() - workflowStartedAt,
      });

      const reviewDecisionRows = buildReviewDecisions({
        groups,
        incidents,
        insertedIncidents,
        representativeResults,
        userId: user.id,
        logId: logRecord.id,
      })
        .filter((item) => item.decision.needsReview)
        .map((item) => ({
          log_error_id: item.logErrorId,
          log_id: item.logId,
          user_id: item.userId,
          final_error_type: item.decision.finalErrorType,
          final_risk_level: item.decision.finalRiskLevel,
          review_status: item.decision.reviewStatus,
          review_note: item.decision.reviewNote,
        }) satisfies PendingReviewRow);

      const dualCheckReviews = (await createDualCheckReviewRows({
        groups,
        incidents,
        insertedIncidents,
        representativeInputs,
        representativeResults,
        ruleOnlyIndexes,
        userId: user.id,
        logId: logRecord.id,
        resolveRagContext:
          analysisMode === "model_only"
            ? async () => []
            : (input) =>
                resolveKnowledgeBaseContext(input, {
                  selectedKnowledgeIds,
                }),
      })) as PendingReviewRow[];

      const analyses = groups.flatMap((group, groupIndex) => {
        const result = representativeResults.get(groupIndex);
        if (!result) {
          return [];
        }

        return group.memberIndices.map((memberIndex) => ({
          log_error_id: insertedIncidents[memberIndex].id,
          log_id: logRecord.id,
          user_id: user.id,
          cause: result.cause,
          risk_level: result.riskLevel,
          confidence: result.confidence,
          repair_suggestion: result.repairSuggestion,
          rag_context: result.ragContext.length > 0 ? JSON.stringify(result.ragContext) : null,
          model_name: result.modelName,
          analysis_mode: analysisMode,
          latency_ms: result.latencyMs,
          tokens_used: result.tokensUsed,
        }));
      });

      const { error: analysisError } = await supabase.from("analysis_results").insert(analyses);

      if (analysisError) {
        throw new Error(analysisError.message);
      }

      traceAnalysisStage("analysis_results_inserted", {
        logId: logRecord.id,
        rows: analyses.length,
        totalElapsedMs: Date.now() - workflowStartedAt,
      });

      const reviewRows = mergeReviewRows(reviewDecisionRows, dualCheckReviews);

      if (reviewRows.length > 0) {
        const { error: reviewInsertError } = await supabase.from("review_cases").insert(reviewRows);

        if (reviewInsertError) {
          console.error("Failed to insert review cases:", reviewInsertError.message);
        }
      }

      traceAnalysisStage("review_rows_done", {
        logId: logRecord.id,
        rows: reviewRows.length,
        totalElapsedMs: Date.now() - workflowStartedAt,
      });
    }

    const { error: updateError } = await supabase
      .from("logs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", logRecord.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    traceAnalysisStage("workflow_completed", {
      logId: logRecord.id,
      incidentsCount: incidents.length,
      analysisMode,
      totalElapsedMs: Date.now() - workflowStartedAt,
    });

    return {
      logId: logRecord.id,
      fileName: file.name,
      analysisMode,
      incidentsCount: incidents.length,
    };
  } catch (error) {
    await supabase
      .from("logs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", logRecord.id);

    traceAnalysisStage("workflow_failed", {
      logId: logRecord.id,
      error: error instanceof Error ? error.message : "unknown_error",
      totalElapsedMs: Date.now() - workflowStartedAt,
    });

    throw error;
  }
}
