import type { LlmAnalysisResponse } from "@/lib/llm/types";

function normalizeRiskLevel(value: unknown): LlmAnalysisResponse["riskLevel"] {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  if (value === "高") {
    return "high";
  }

  if (value === "中") {
    return "medium";
  }

  if (value === "低") {
    return "low";
  }

  return "medium";
}

function normalizeConfidence(value: unknown) {
  if (value === "高") {
    return 0.9;
  }

  if (value === "中") {
    return 0.7;
  }

  if (value === "低") {
    return 0.45;
  }

  if (value === "未知") {
    return 0.25;
  }

  const numeric = typeof value === "number" ? value : Number(value ?? 0);

  if (!Number.isFinite(numeric)) {
    return 0.65;
  }

  if (numeric < 0) {
    return 0;
  }

  if (numeric > 1) {
    return 1;
  }

  return numeric;
}

export function validateLlmAnalysisResponse(payload: unknown): LlmAnalysisResponse {
  if (!payload || typeof payload !== "object") {
    throw new Error("Model response was not a JSON object.");
  }

  const record = payload as Record<string, unknown>;
  const zhIssueType = typeof record["问题类型"] === "string" ? String(record["问题类型"]).trim() : "";
  const zhKeywords = typeof record["核心关键词"] === "string" ? String(record["核心关键词"]).trim() : "";
  const zhRootCause = typeof record["根因分析"] === "string" ? String(record["根因分析"]).trim() : "";
  const zhSolution = typeof record["解决方案"] === "string" ? String(record["解决方案"]).trim() : "";
  const zhRiskLevel = record["风险等级"];
  const zhCredibility = record["可信度"];

  const causeFromZh = [
    zhIssueType ? `问题类型：${zhIssueType}` : "",
    zhKeywords ? `核心关键词：${zhKeywords}` : "",
    zhRootCause ? `根因分析：${zhRootCause}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const cause = typeof record.cause === "string" ? record.cause.trim() : causeFromZh;
  const repairSuggestion =
    typeof record.repairSuggestion === "string"
      ? record.repairSuggestion.trim()
      : zhSolution;

  if (!cause || !repairSuggestion) {
    throw new Error("Model response was missing cause or repairSuggestion.");
  }

  return {
    cause,
    riskLevel: normalizeRiskLevel(record.riskLevel ?? zhRiskLevel),
    confidence: normalizeConfidence(record.confidence ?? zhCredibility),
    repairSuggestion,
    tokensUsed:
      typeof record.tokensUsed === "number"
        ? record.tokensUsed
        : Number(record.tokensUsed ?? 0),
    rawResponse:
      typeof record.rawResponse === "string" ? record.rawResponse : undefined,
  };
}
