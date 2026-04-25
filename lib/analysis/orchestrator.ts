import { buildRuleAnalysisDraft } from "@/lib/analysis/rule-analysis";
import type {
  IncidentAnalysisInput,
  NormalizedAnalysisResult,
  RagContextItem,
} from "@/lib/analysis/types";
import { getLlmProvider } from "@/lib/llm";
import type { LlmProviderId } from "@/lib/llm/types";
import type { DetectedIncident } from "@/lib/rules/types";

const DEFAULT_ANALYSIS_CONCURRENCY = 3;
const HYBRID_MAX_GROUPS = 5;
const GROUP_NEARBY_LINE_WINDOW = 12;
const GROUP_SIMILARITY_THRESHOLD = 0.78;
const DUAL_CHECK_SAMPLE_RATE = 0.02;
const DUAL_CHECK_MAX_GROUPS = 3;
const DUAL_CHECK_CONFIDENCE_GAP = 0.18;
const DUAL_CHECK_TEXT_SIMILARITY_THRESHOLD = 0.45;
const REVIEW_CONFIDENCE_THRESHOLD = 0.72;
const ENABLE_ANALYSIS_TRACE = process.env.ANALYSIS_TRACE === "1";

type ConfidenceLevel = "low" | "medium" | "high";

type ModelAnalysisResultCompat = NormalizedAnalysisResult & {
  incidentId: string;
  confidenceLevel: ConfidenceLevel;
  evidenceLines: number[];
  needsReview: boolean;
  providerUsed: string;
};

export type AnalysisMode = "rule_only" | "model_only" | "hybrid";

export type IncidentGroup = {
  representativeIndex: number;
  memberIndices: number[];
  signature: string;
};

export type ReviewDecisionReasonCode =
  | "rule_only_result"
  | "high_risk"
  | "low_confidence"
  | "existing_review"
  | "explicit_uncertain"
  | "missing_analysis"
  | "dual_check_diverged";

export type ReviewDecision = {
  incidentId: string;
  needsReview: boolean;
  reviewStatus: "pending" | "completed" | "skipped";
  reviewReasonCodes: ReviewDecisionReasonCode[];
  reviewNote: string | null;
  finalErrorType: string | null;
  finalRiskLevel: "low" | "medium" | "high" | null;
};

type ReviewDecisionAnalysisInput = {
  riskLevel: string | null;
  confidence: number | null;
  modelName?: string | null;
  source?: "rule" | "llm" | null;
};

type AnalyzeIncidentsOptions = {
  providerId?: LlmProviderId | null;
  resolveRagContext?: (input: IncidentAnalysisInput) => Promise<RagContextItem[]>;
  concurrency?: number;
};

type AnalyzeRepresentativeGroupsOptions = {
  inputs: IncidentAnalysisInput[];
  llmIndexes: number[];
  ruleOnlyIndexes: number[];
  resolveRagContext: NonNullable<AnalyzeIncidentsOptions["resolveRagContext"]>;
};

type BuildRepresentativeAnalysisPlanParams = {
  incidents: DetectedIncident[];
  sourceType: string;
  logContent: string;
  analysisMode: AnalysisMode;
};

type CreateDualCheckReviewRowsParams = {
  groups: IncidentGroup[];
  incidents: DetectedIncident[];
  insertedIncidents: { id: string }[];
  representativeInputs: IncidentAnalysisInput[];
  representativeResults: Map<number, NormalizedAnalysisResult>;
  ruleOnlyIndexes: number[];
  userId: string;
  logId: string;
  resolveRagContext: NonNullable<AnalyzeIncidentsOptions["resolveRagContext"]>;
};

type BuildReviewDecisionsParams = {
  groups: IncidentGroup[];
  incidents: DetectedIncident[];
  insertedIncidents: { id: string }[];
  representativeResults: Map<number, NormalizedAnalysisResult>;
  userId: string;
  logId: string;
};

export type ReviewDecisionRecord = {
  logErrorId: string;
  logId: string;
  userId: string;
  decision: ReviewDecision;
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

export async function analyzeIncidents(
  inputs: IncidentAnalysisInput[],
  options: AnalyzeIncidentsOptions = {},
) {
  const startedAt = Date.now();
  const provider = getLlmProvider(options.providerId);
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_ANALYSIS_CONCURRENCY);

  const results = await mapWithConcurrency(inputs, concurrency, async (input) => {
    if (!provider) {
      return buildRuleOnlyResult(input, input.ragContext ?? []);
    }

    const ragContext = input.ragContext ?? (await options.resolveRagContext?.(input)) ?? [];

    try {
      const startedAt = Date.now();
      const response = await provider.analyzeIncident({
        sourceType: input.sourceType,
        logContent: input.logContent,
        incident: input.incident,
        ragContext,
        analysisMode: input.analysisMode,
      });

      return buildModelResult({
        input,
        ragContext,
        cause: response.cause,
        riskLevel: response.riskLevel,
        confidence: response.confidence,
        repairSuggestion: response.repairSuggestion,
        modelName: response.model ?? provider.model,
        latencyMs: Date.now() - startedAt,
        tokensUsed: response.tokensUsed ?? 0,
        providerId: provider.id,
        source: "llm",
      });
    } catch {
      return buildRuleOnlyResult(input, ragContext);
    }
  });

  traceAnalysisStage("orchestrator_analyze_incidents", {
    inputCount: inputs.length,
    providerId: provider?.id ?? "rule_only",
    concurrency,
    elapsedMs: Date.now() - startedAt,
  });

  return results;
}

export function buildRepresentativeAnalysisPlan(
  params: BuildRepresentativeAnalysisPlanParams,
) {
  const groups = createIncidentGroups(params.incidents);
  const llmGroupIndexes = selectLlmGroupIndexes(groups, params.incidents, params.analysisMode);
  const representativeInputs = groups.map((group) => ({
    incident: params.incidents[group.representativeIndex],
    sourceType: params.sourceType,
    logContent: params.logContent,
    analysisMode: params.analysisMode,
  }));

  const llmIndexes: number[] = [];
  const ruleOnlyIndexes: number[] = [];

  groups.forEach((_, index) => {
    if (llmGroupIndexes.has(index)) {
      llmIndexes.push(index);
      return;
    }

    ruleOnlyIndexes.push(index);
  });

  return {
    groups,
    representativeInputs,
    llmIndexes,
    ruleOnlyIndexes,
  };
}

export async function analyzeRepresentativeGroups(
  options: AnalyzeRepresentativeGroupsOptions,
) {
  const startedAt = Date.now();
  const resultsByIndex = new Map<number, NormalizedAnalysisResult>();

  if (options.llmIndexes.length > 0) {
    const llmResults = await analyzeIncidents(
      options.llmIndexes.map((index) => options.inputs[index]),
      { resolveRagContext: options.resolveRagContext },
    );

    options.llmIndexes.forEach((index, resultIndex) => {
      resultsByIndex.set(index, llmResults[resultIndex]);
    });
  }

  if (options.ruleOnlyIndexes.length > 0) {
    const ruleOnlyResults = await analyzeIncidents(
      options.ruleOnlyIndexes.map((index) => options.inputs[index]),
      { providerId: null },
    );

    options.ruleOnlyIndexes.forEach((index, resultIndex) => {
      resultsByIndex.set(index, ruleOnlyResults[resultIndex]);
    });
  }

  traceAnalysisStage("orchestrator_representative_groups", {
    totalGroups: options.inputs.length,
    llmGroupCount: options.llmIndexes.length,
    ruleOnlyGroupCount: options.ruleOnlyIndexes.length,
    resultCount: resultsByIndex.size,
    elapsedMs: Date.now() - startedAt,
  });

  return resultsByIndex;
}

export async function createDualCheckReviewRows(
  params: CreateDualCheckReviewRowsParams,
) {
  const sampledGroupIndexes = selectDualCheckGroupIndexes(params.ruleOnlyIndexes);

  if (sampledGroupIndexes.length === 0) {
    return [] as Array<Record<string, unknown>>;
  }

  const llmShadowResults = await analyzeIncidents(
    sampledGroupIndexes.map((index) => params.representativeInputs[index]),
    { resolveRagContext: params.resolveRagContext },
  );

  return sampledGroupIndexes.flatMap((groupIndex, resultIndex) => {
    const ruleResult = params.representativeResults.get(groupIndex);
    const llmResult = llmShadowResults[resultIndex];

    if (!ruleResult || !llmResult || !hasMeaningfulAnalysisDifference(ruleResult, llmResult)) {
      return [];
    }

    const representativeMemberIndex = params.groups[groupIndex].memberIndices[0];
    const incident = params.incidents[params.groups[groupIndex].representativeIndex];
    const reviewNote =
      "Dual-check sampled. Rule(" +
      ruleResult.riskLevel +
      ", " +
      ruleResult.confidence.toFixed(2) +
      ") vs LLM(" +
      llmResult.riskLevel +
      ", " +
      llmResult.confidence.toFixed(2) +
      ") diverged.";

    const decision = buildReviewDecision({
      incidentId: params.insertedIncidents[representativeMemberIndex].id,
      errorType: incident.errorType,
      analysis: toReviewDecisionAnalysisInput(llmResult),
      extraReasonCodes: ["dual_check_diverged"],
      reviewNote,
    });

    return [{
      log_error_id: params.insertedIncidents[representativeMemberIndex].id,
      log_id: params.logId,
      user_id: params.userId,
      final_error_type: decision.finalErrorType,
      final_risk_level: decision.finalRiskLevel,
      review_status: decision.reviewStatus,
      review_note: decision.reviewNote,
    }];
  });
}

export function buildReviewDecisions(params: BuildReviewDecisionsParams): ReviewDecisionRecord[] {
  return params.groups.flatMap((group, groupIndex) => {
    const analysis = params.representativeResults.get(groupIndex);
    if (!analysis) {
      return [] as ReviewDecisionRecord[];
    }

    return group.memberIndices.map((memberIndex) => ({
      logErrorId: params.insertedIncidents[memberIndex].id,
      logId: params.logId,
      userId: params.userId,
      decision: buildReviewDecision({
        incidentId: params.insertedIncidents[memberIndex].id,
        errorType: params.incidents[memberIndex].errorType,
        analysis: toReviewDecisionAnalysisInput(analysis),
      }),
    }));
  });
}

export function buildReviewDecision(params: {
  incidentId: string;
  errorType: string | null;
  analysis?: ReviewDecisionAnalysisInput | undefined;
  hasExistingReview?: boolean;
  isUncertain?: boolean | null;
  reviewStatus?: ReviewDecision["reviewStatus"];
  extraReasonCodes?: ReviewDecisionReasonCode[];
  reviewNote?: string | null;
}): ReviewDecision {
  const reasons: ReviewDecisionReasonCode[] = [];

  if (params.hasExistingReview) {
    reasons.push("existing_review");
  }

  if (params.isUncertain) {
    reasons.push("explicit_uncertain");
  }

  if (!params.analysis) {
    reasons.push("missing_analysis");
  }

  const normalizedRiskLevel = normalizeRiskLevel(params.analysis?.riskLevel ?? null);
  const normalizedSource = normalizeDecisionAnalysisSource(params.analysis);

  if (normalizedSource === "rule") {
    reasons.push("rule_only_result");
  }

  if (normalizedRiskLevel === "high") {
    reasons.push("high_risk");
  }

  if (
    typeof params.analysis?.confidence === "number" &&
    params.analysis.confidence < REVIEW_CONFIDENCE_THRESHOLD
  ) {
    reasons.push("low_confidence");
  }

  if (params.extraReasonCodes) {
    reasons.push(...params.extraReasonCodes);
  }

  const reviewReasonCodes = Array.from(new Set(reasons));
  const needsReview = reviewReasonCodes.length > 0;
  const reviewStatus = params.reviewStatus ?? "pending";
  const reviewNote = params.reviewNote ?? createReviewReasonNote(reviewReasonCodes);

  return {
    incidentId: params.incidentId,
    needsReview,
    reviewStatus,
    reviewReasonCodes,
    reviewNote,
    finalErrorType: params.errorType,
    finalRiskLevel: normalizedRiskLevel,
  };
}

export function createIncidentGroups(incidents: DetectedIncident[]) {
  const groups: IncidentGroup[] = [];

  incidents.forEach((incident, index) => {
    const existingGroup = groups.find((group) =>
      shouldGroupIncidents(incident, incidents[group.representativeIndex]),
    );

    if (existingGroup) {
      existingGroup.memberIndices.push(index);
      return;
    }

    groups.push({
      representativeIndex: index,
      memberIndices: [index],
      signature: normalizeIncidentText(incident.rawText),
    });
  });

  return groups;
}

export function selectLlmGroupIndexes(
  groups: IncidentGroup[],
  incidents: DetectedIncident[],
  analysisMode: AnalysisMode,
) {
  if (analysisMode === "rule_only") {
    return new Set<number>();
  }

  if (analysisMode === "model_only") {
    return new Set(groups.map((_, index) => index));
  }

  const maxGroups = HYBRID_MAX_GROUPS;

  return new Set(
    groups
      .map((group, index) => ({
        index,
        score:
          group.memberIndices.length * 10 +
          getRiskWeight(incidents[group.representativeIndex].riskLevel) * 5 -
          incidents[group.representativeIndex].lineNumber / 10000,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxGroups)
      .map((item) => item.index),
  );
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
) {
  if (items.length === 0) {
    return [] as TOutput[];
  }

  const results = new Array<TOutput>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}

function buildRuleOnlyResult(
  input: IncidentAnalysisInput,
  ragContext: RagContextItem[],
): ModelAnalysisResultCompat {
  const startedAt = Date.now();
  const draft = buildRuleAnalysisDraft(input.incident, input.sourceType);

  return buildModelResult({
    input,
    ragContext,
    cause: draft.cause,
    riskLevel: draft.riskLevel,
    confidence: draft.confidence,
    repairSuggestion: draft.repairSuggestion,
    modelName: "rule-engine-v1",
    latencyMs: Math.max(1, Date.now() - startedAt),
    tokensUsed: 0,
    providerId: "mock",
    source: "rule",
  });
}

function buildModelResult(params: {
  input: IncidentAnalysisInput;
  ragContext: RagContextItem[];
  cause: string;
  riskLevel: NormalizedAnalysisResult["riskLevel"];
  confidence: number;
  repairSuggestion: string;
  modelName: string;
  latencyMs: number | null;
  tokensUsed: number;
  providerId: string;
  source: NormalizedAnalysisResult["source"];
}): ModelAnalysisResultCompat {
  const incidentId = resolveIncidentId(params.input);
  const evidenceLines = resolveEvidenceLines(params.input);

  return {
    incidentId,
    cause: params.cause,
    riskLevel: params.riskLevel,
    confidence: params.confidence,
    confidenceLevel: toConfidenceLevel(params.confidence),
    repairSuggestion: params.repairSuggestion,
    evidenceLines,
    needsReview: shouldReview({
      source: params.source,
      riskLevel: params.riskLevel,
      confidence: params.confidence,
    }),
    providerUsed: params.providerId,
    ragContext: params.ragContext,
    modelName: params.modelName,
    latencyMs: params.latencyMs,
    tokensUsed: params.tokensUsed,
    providerId: params.providerId,
    source: params.source,
  };
}

function toReviewDecisionAnalysisInput(
  analysis: NormalizedAnalysisResult,
): ReviewDecisionAnalysisInput {
  return {
    riskLevel: analysis.riskLevel,
    confidence: analysis.confidence,
    modelName: analysis.modelName,
    source: analysis.source,
  };
}

function normalizeDecisionAnalysisSource(analysis: ReviewDecisionAnalysisInput | undefined) {
  if (!analysis) {
    return null;
  }

  if (analysis.source === "rule" || analysis.source === "llm") {
    return analysis.source;
  }

  if (analysis.modelName === "rule-engine-v1") {
    return "rule";
  }

  return "llm";
}

function normalizeRiskLevel(value: string | null | undefined) {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return null;
}

function createReviewReasonNote(reasonCodes: ReviewDecisionReasonCode[]) {
  if (reasonCodes.length === 0) {
    return null;
  }

  return `Review reasons: ${reasonCodes.join(", ")}`;
}

function resolveIncidentId(input: IncidentAnalysisInput) {
  const candidate = (input.incident as { incidentId?: unknown }).incidentId;
  return typeof candidate === "string" ? candidate : "";
}

function resolveEvidenceLines(input: IncidentAnalysisInput) {
  const matchedLines = (input.incident as { matchedLines?: unknown }).matchedLines;

  if (Array.isArray(matchedLines)) {
    const normalized = (matchedLines as unknown[]).filter(
      (line): line is number => typeof line === "number" && Number.isFinite(line) && line > 0,
    );

    if (normalized.length > 0) {
      return normalized;
    }
  }

  const lineNumber = input.incident.lineNumber;
  return Number.isFinite(lineNumber) && lineNumber > 0 ? [lineNumber] : [];
}

function toConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence < 0.6) {
    return "low";
  }

  if (confidence < 0.8) {
    return "medium";
  }

  return "high";
}

function shouldReview(params: {
  source: NormalizedAnalysisResult["source"];
  riskLevel: NormalizedAnalysisResult["riskLevel"];
  confidence: number;
}) {
  return (
    params.source === "rule" ||
    params.riskLevel === "high" ||
    params.confidence < REVIEW_CONFIDENCE_THRESHOLD
  );
}

function normalizeIncidentText(rawText: string) {
  return rawText
    .toLowerCase()
    .replace(/\b\d{4}-\d{2}-\d{2}[ t]\d{2}:\d{2}:\d{2}(?:[,.:]\d+)?\b/g, " ")
    .replace(/\b\d+(?:ms|s|m|h)?\b/g, " # ")
    .replace(/\b[0-9a-f]{8,}\b/g, " # ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeIncident(rawText: string) {
  return normalizeIncidentText(rawText)
    .split(" ")
    .filter((token) => token.length >= 3);
}

function calculateTokenSimilarity(a: string[], b: string[]) {
  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  const aSet = new Set(a);
  const bSet = new Set(b);
  let overlap = 0;

  for (const token of aSet) {
    if (bSet.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(aSet.size, bSet.size);
}

function shouldGroupIncidents(current: DetectedIncident, representative: DetectedIncident) {
  if (current.errorType !== representative.errorType) {
    return false;
  }

  const currentSignature = normalizeIncidentText(current.rawText);
  const representativeSignature = normalizeIncidentText(representative.rawText);

  if (!currentSignature || !representativeSignature) {
    return false;
  }

  if (currentSignature === representativeSignature) {
    return true;
  }

  const lineDistance = Math.abs(current.lineNumber - representative.lineNumber);
  const similarity = calculateTokenSimilarity(
    tokenizeIncident(current.rawText),
    tokenizeIncident(representative.rawText),
  );

  return lineDistance <= GROUP_NEARBY_LINE_WINDOW && similarity >= GROUP_SIMILARITY_THRESHOLD;
}

function getRiskWeight(riskLevel: DetectedIncident["riskLevel"]) {
  if (riskLevel === "high") return 3;
  if (riskLevel === "medium") return 2;
  return 1;
}

function getRiskRank(riskLevel: "low" | "medium" | "high") {
  if (riskLevel === "high") return 3;
  if (riskLevel === "medium") return 2;
  return 1;
}

function tokenizeAnalysisText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token.length >= 3);
}

function hasMeaningfulAnalysisDifference(
  ruleResult: NormalizedAnalysisResult,
  llmResult: NormalizedAnalysisResult,
) {
  if (getRiskRank(ruleResult.riskLevel) !== getRiskRank(llmResult.riskLevel)) {
    return true;
  }

  if (Math.abs(ruleResult.confidence - llmResult.confidence) >= DUAL_CHECK_CONFIDENCE_GAP) {
    return true;
  }

  const causeSimilarity = calculateTokenSimilarity(
    tokenizeAnalysisText(ruleResult.cause),
    tokenizeAnalysisText(llmResult.cause),
  );

  return causeSimilarity < DUAL_CHECK_TEXT_SIMILARITY_THRESHOLD;
}

function selectDualCheckGroupIndexes(ruleOnlyIndexes: number[]) {
  if (ruleOnlyIndexes.length === 0) {
    return [] as number[];
  }

  return ruleOnlyIndexes
    .filter(() => Math.random() < DUAL_CHECK_SAMPLE_RATE)
    .slice(0, DUAL_CHECK_MAX_GROUPS);
}
