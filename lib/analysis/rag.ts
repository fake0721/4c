import type { IncidentAnalysisInput, RagContextItem } from "@/lib/analysis/types";
import { buildEmbeddingInput, embedText, hasEmbeddingConfig } from "@/lib/llm/embeddings";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server-client";

type KnowledgeLayer = "exception_case" | "historical_missed" | "ops_experience";

type KnowledgeEntryRow = {
  knowledge_layer: KnowledgeLayer;
  source_table: string;
  source_id: string;
  title: string;
  error_type: string | null;
  keywords: string | null;
  log_excerpt: string | null;
  root_cause: string | null;
  solution: string | null;
  source_type: string | null;
  verified: boolean | null;
  updated_at: string | null;
  source_label: string | null;
  cluster_key: string | null;
  priority: number | null;
};

type VectorKnowledgeEntryRow = KnowledgeEntryRow & {
  similarity: number | null;
};

export type RagRetrievedCase = {
  title: string;
  errorType: string | null;
  similarityScore: number | null;
  rootCause: string | null;
  repairSuggestion: string | null;
  sourceType: string | null;
  summary: string;
  source: string;
};

export type RagResult = {
  incidentId: string;
  querySummary: string;
  retrievedCases: RagRetrievedCase[];
};

type RankedRetrievedCase = RagRetrievedCase & {
  rankScore: number;
  sourceAligned: boolean;
  errorAligned: boolean;
  dedupeKey: string;
  knowledgeLayer: KnowledgeLayer;
  sourceTable: string | null;
  sourceId: string | null;
};

type ResolveKnowledgeBaseContextOptions = {
  selectedKnowledgeIds?: string[];
};

type QueryTerms = ReturnType<typeof buildQueryTerms>;
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type RetrievalAttempt = {
  knowledgeLayers?: KnowledgeLayer[];
  sourceType?: string | null;
  errorType?: string | null;
  verifiedOnly: boolean;
};

const MAX_CONTEXT_ITEMS = 5;
const MAX_VECTOR_ROWS = 24;
const MAX_KEYWORD_ROWS = 40;
const MAX_SEARCH_TERMS = 14;
const MAX_SCORING_TERMS = 28;
const MAX_QUERY_SUMMARY_PHRASES = 3;
const MAX_EMBEDDING_INPUT_LENGTH = 2000;
const MIN_KEYWORD_SCORE = 5;
const MIN_VECTOR_SIMILARITY = 0.48;
const MIN_VECTOR_LEXICAL_SCORE = 4;
const LAYER_BOOSTS: Record<KnowledgeLayer, number> = {
  historical_missed: 30,
  exception_case: 18,
  ops_experience: 10,
};
const LAYER_SOURCE_LABELS: Record<KnowledgeLayer, string> = {
  historical_missed: "historical_missed_cases",
  exception_case: "knowledge_base",
  ops_experience: "ops_experience_library",
};
const ERROR_TYPE_HINTS: Record<string, string[]> = {
  database_error: ["database", "postgres", "mysql", "oracle", "sql", "deadlock"],
  network_error: ["connection refused", "connection reset", "dns", "host unreachable", "ssl", "network"],
  permission_error: ["permission denied", "unauthorized", "forbidden", "invalid token", "authentication failed"],
  service_error: ["service unavailable", "fatal", "panic", "crash", "restart", "component", "runtime"],
  configuration_error: ["config", "configuration", "yaml", "missing property", "environment variable"],
  resource_exhaustion: ["out of memory", "oom", "no space left", "disk full", "too many open files", "cpu"],
  timeout: ["timeout", "timed out", "read timeout", "connect timeout", "gateway timeout"],
  unknown_error: ["exception", "error", "traceback"],
};
const SOURCE_TYPE_ALIASES: Record<string, string[]> = {
  nginx: ["nginx", "apache", "gateway", "web", "upstream"],
  postgres: ["postgres", "postgresql", "database", "sql", "mysql", "oracle"],
  application: ["application", "java", "python", "spring", "django", "node", "runtime"],
  system: ["system", "kernel", "linux", "service", "ssh", "dns", "firewall"],
  custom: ["custom"],
};
const ENABLE_ANALYSIS_TRACE = process.env.ANALYSIS_TRACE === "1";

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

function normalizeText(value: string | null | undefined) {
  return value?.toLowerCase().trim() ?? "";
}

function tokenizeText(value: string) {
  return value
    .split(/[^a-z0-9_\u4e00-\u9fa5]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4 || /[\u4e00-\u9fa5]/.test(term));
}

function expandSourceHints(sourceType: string) {
  return SOURCE_TYPE_ALIASES[sourceType] ?? [];
}

function extractRawPhrases(rawText: string) {
  return rawText
    .toLowerCase()
    .split(/[|,;]+/)
    .map((part) => part.trim())
    .map((part) => part.replace(/\s+/g, " "))
    .filter((part) => part.length >= 8)
    .filter((part) => /[a-z\u4e00-\u9fa5]/.test(part))
    .slice(0, 8);
}

function shouldFilterByErrorType(errorType: string) {
  return Boolean(errorType && errorType !== "unknown_error");
}

function buildQueryTerms(input: IncidentAnalysisInput) {
  const rawText = normalizeText(input.incident.rawText);
  const ruleName = normalizeText(input.incident.ruleName);
  const sourceType = normalizeText(input.sourceType) || "custom";
  const errorType = normalizeText(input.incident.errorType);
  const sourceHints = expandSourceHints(sourceType);
  const errorHints = ERROR_TYPE_HINTS[errorType] ?? [];
  const phrases = extractRawPhrases(rawText);

  const searchTerms = Array.from(
    new Set(
      [sourceType, errorType, ruleName, ...sourceHints, ...errorHints, ...phrases]
        .flatMap((value) => tokenizeText(value))
        .filter(Boolean),
    ),
  ).slice(0, MAX_SEARCH_TERMS);

  const scoringTerms = Array.from(
    new Set(
      [
        sourceType,
        errorType,
        ruleName,
        rawText,
        ...sourceHints,
        ...errorHints,
        ...phrases,
        ...tokenizeText(`${sourceType} ${errorType} ${ruleName} ${rawText}`),
      ].filter(Boolean),
    ),
  ).slice(0, MAX_SCORING_TERMS);

  return {
    searchTerms,
    scoringTerms,
    phrases,
    rawText,
    sourceType,
    errorType,
    ruleName,
  };
}

function buildQuerySummary(queryTerms: QueryTerms) {
  const segments = [
    queryTerms.sourceType ? `sourceType=${queryTerms.sourceType}` : null,
    queryTerms.errorType ? `errorType=${queryTerms.errorType}` : null,
    queryTerms.ruleName ? `rule=${queryTerms.ruleName}` : null,
    queryTerms.phrases.length > 0
      ? `phrases=${queryTerms.phrases.slice(0, MAX_QUERY_SUMMARY_PHRASES).join(" | ")}`
      : null,
  ].filter(Boolean);

  return segments.length > 0
    ? segments.join("; ")
    : queryTerms.rawText.slice(0, 120) || "no-query-context";
}

function buildRetrievalAttempts(
  queryTerms: QueryTerms,
  knowledgeLayers?: KnowledgeLayer[],
): RetrievalAttempt[] {
  const attempts: RetrievalAttempt[] = [];
  const errorType = shouldFilterByErrorType(queryTerms.errorType) ? queryTerms.errorType : null;
  const sourceType = queryTerms.sourceType || null;

  const candidates: RetrievalAttempt[] = [
    { knowledgeLayers, errorType, sourceType, verifiedOnly: true },
    { knowledgeLayers, errorType, sourceType: null, verifiedOnly: true },
    { knowledgeLayers, errorType: null, sourceType, verifiedOnly: true },
    { knowledgeLayers, errorType: null, sourceType: null, verifiedOnly: true },
  ];

  for (const item of candidates) {
    const key = JSON.stringify(item);
    if (!attempts.some((existing) => JSON.stringify(existing) === key)) {
      attempts.push(item);
    }
  }

  return attempts;
}

function countMatches(value: string, terms: string[], weight: number) {
  return terms.reduce((score, term) => {
    if (!term || !value.includes(term)) {
      return score;
    }

    return score + weight;
  }, 0);
}

function buildRowText(row: KnowledgeEntryRow) {
  return [
    normalizeText(row.title),
    normalizeText(row.error_type),
    normalizeText(row.keywords),
    normalizeText(row.log_excerpt),
    normalizeText(row.root_cause),
    normalizeText(row.solution),
    normalizeText(row.source_type),
    normalizeText(row.source_label),
  ].join(" ");
}

function matchesSourceDomain(row: KnowledgeEntryRow, sourceType: string) {
  if (!sourceType) {
    return false;
  }

  if (normalizeText(row.source_type) === sourceType) {
    return true;
  }

  const rowText = buildRowText(row);
  return expandSourceHints(sourceType).some((hint) => rowText.includes(hint));
}

function matchesErrorType(row: KnowledgeEntryRow, errorType: string) {
  if (!errorType || errorType === "unknown_error") {
    return false;
  }

  if (normalizeText(row.error_type) === errorType) {
    return true;
  }

  const rowText = buildRowText(row);
  return (ERROR_TYPE_HINTS[errorType] ?? []).some((hint) => rowText.includes(hint));
}

function scoreKnowledgeRow(row: KnowledgeEntryRow, queryTerms: QueryTerms) {
  const title = normalizeText(row.title);
  const keywords = normalizeText(row.keywords);
  const excerpt = normalizeText(row.log_excerpt);
  const rootCause = normalizeText(row.root_cause);
  const solution = normalizeText(row.solution);
  const sourceLabel = normalizeText(row.source_label);
  const errorType = normalizeText(row.error_type);
  const sourceType = normalizeText(row.source_type);

  let score = 0;
  score += countMatches(title, queryTerms.scoringTerms, 8);
  score += countMatches(keywords, queryTerms.scoringTerms, 6);
  score += countMatches(excerpt, queryTerms.scoringTerms, 5);
  score += countMatches(rootCause, queryTerms.scoringTerms, 4);
  score += countMatches(solution, queryTerms.scoringTerms, 3);
  score += countMatches(sourceLabel, queryTerms.scoringTerms, 2);

  if (queryTerms.phrases.some((phrase) => title.includes(phrase))) score += 8;
  if (queryTerms.phrases.some((phrase) => excerpt.includes(phrase))) score += 6;
  if (queryTerms.phrases.some((phrase) => rootCause.includes(phrase))) score += 5;

  if (queryTerms.sourceType && sourceType === queryTerms.sourceType) {
    score += 8;
  }

  if (queryTerms.errorType && errorType === queryTerms.errorType) {
    score += 10;
  }

  if (queryTerms.ruleName && (title.includes(queryTerms.ruleName) || keywords.includes(queryTerms.ruleName))) {
    score += 5;
  }

  return score;
}

function buildKnowledgeSummary(row: KnowledgeEntryRow) {
  return [row.log_excerpt, row.root_cause, row.solution]
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .join(" / ");
}

function inferFreshnessBoost(updatedAt: string | null | undefined) {
  const timestamp = Date.parse(String(updatedAt ?? ""));
  if (!Number.isFinite(timestamp)) {
    return 0;
  }

  const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  if (ageDays <= 30) return 4;
  if (ageDays <= 90) return 3;
  if (ageDays <= 180) return 2;
  if (ageDays <= 365) return 1;
  return 0;
}

function toRankedRetrievedCase(params: {
  row: KnowledgeEntryRow;
  queryTerms: QueryTerms;
  lexicalScore: number;
  similarityScore: number | null;
}) {
  const sourceAligned = matchesSourceDomain(params.row, params.queryTerms.sourceType);
  const errorAligned = matchesErrorType(params.row, params.queryTerms.errorType);
  const layerBoost = LAYER_BOOSTS[params.row.knowledge_layer] ?? 0;
  const verifiedBoost = params.row.verified ? 8 : 0;
  const priorityBoost = Math.max(0, Math.min(params.row.priority ?? 0, 30));
  const freshnessBoost = inferFreshnessBoost(params.row.updated_at);
  const vectorBoost = params.similarityScore ? Math.round(params.similarityScore * 20) : 0;
  const rankScore =
    params.lexicalScore +
    layerBoost +
    verifiedBoost +
    priorityBoost +
    freshnessBoost +
    vectorBoost +
    (sourceAligned ? 6 : 0) +
    (errorAligned ? 10 : 0);
  const source = params.row.source_label || LAYER_SOURCE_LABELS[params.row.knowledge_layer];
  const dedupeKey =
    params.row.cluster_key ||
    `${params.row.knowledge_layer}::${params.row.title.toLowerCase()}::${normalizeText(params.row.error_type)}::${normalizeText(params.row.source_type)}`;

  return {
    title: params.row.title,
    errorType: params.row.error_type,
    similarityScore: params.similarityScore,
    rootCause: params.row.root_cause,
    repairSuggestion: params.row.solution,
    sourceType: params.row.source_type,
    summary: buildKnowledgeSummary(params.row),
    source,
    rankScore,
    sourceAligned,
    errorAligned,
    dedupeKey,
    knowledgeLayer: params.row.knowledge_layer,
    sourceTable: params.row.source_table,
    sourceId: params.row.source_id,
  } satisfies RankedRetrievedCase;
}

function mergeRetrievedCases(...groups: RankedRetrievedCase[][]) {
  const merged = new Map<string, RankedRetrievedCase>();

  for (const items of groups) {
    for (const item of items) {
      const existing = merged.get(item.dedupeKey);

      if (!existing) {
        merged.set(item.dedupeKey, item);
        continue;
      }

      merged.set(item.dedupeKey, {
        ...existing,
        errorType: existing.errorType ?? item.errorType,
        similarityScore: Math.max(existing.similarityScore ?? 0, item.similarityScore ?? 0) || null,
        rootCause: existing.rootCause ?? item.rootCause,
        repairSuggestion: existing.repairSuggestion ?? item.repairSuggestion,
        sourceType: existing.sourceType ?? item.sourceType,
        summary: existing.summary.length >= item.summary.length ? existing.summary : item.summary,
        source: existing.rankScore >= item.rankScore ? existing.source : item.source,
        rankScore: Math.max(existing.rankScore, item.rankScore),
        sourceAligned: existing.sourceAligned || item.sourceAligned,
        errorAligned: existing.errorAligned || item.errorAligned,
        knowledgeLayer:
          LAYER_BOOSTS[existing.knowledgeLayer] >= LAYER_BOOSTS[item.knowledgeLayer]
            ? existing.knowledgeLayer
            : item.knowledgeLayer,
        sourceTable: existing.sourceTable ?? item.sourceTable,
        sourceId: existing.sourceId ?? item.sourceId,
      });
    }
  }

  return Array.from(merged.values())
    .sort(
      (a, b) =>
        b.rankScore - a.rankScore ||
        LAYER_BOOSTS[b.knowledgeLayer] - LAYER_BOOSTS[a.knowledgeLayer] ||
        Number(b.errorAligned) - Number(a.errorAligned) ||
        Number(b.sourceAligned) - Number(a.sourceAligned) ||
        (b.similarityScore ?? 0) - (a.similarityScore ?? 0) ||
        a.title.localeCompare(b.title),
    )
    .slice(0, MAX_CONTEXT_ITEMS);
}

function stripRetrievedCaseMetadata(item: RankedRetrievedCase): RagRetrievedCase {
  return {
    title: item.title,
    errorType: item.errorType,
    similarityScore: item.similarityScore,
    rootCause: item.rootCause,
    repairSuggestion: item.repairSuggestion,
    sourceType: item.sourceType,
    summary: item.summary,
    source: item.source,
  };
}

function toLegacyRagContextItem(item: RankedRetrievedCase): RagContextItem {
  return {
    title: item.title,
    summary: item.summary,
    source: item.source,
    score: item.rankScore,
  };
}

function buildKeywordOrQuery(searchTerms: string[]) {
  return searchTerms
    .flatMap((term) => [
      `title.ilike.%${term}%`,
      `keywords.ilike.%${term}%`,
      `log_excerpt.ilike.%${term}%`,
      `root_cause.ilike.%${term}%`,
      `solution.ilike.%${term}%`,
      `source_label.ilike.%${term}%`,
    ])
    .join(",");
}

type FilterableQuery<T> = {
  eq: (column: string, value: unknown) => T;
  in: (column: string, values: unknown[]) => T;
};

function applyViewFilters<T extends FilterableQuery<T>>(query: T, attempt: RetrievalAttempt): T {
  let next = query;

  if (attempt.knowledgeLayers && attempt.knowledgeLayers.length === 1) {
    next = next.eq("knowledge_layer", attempt.knowledgeLayers[0]);
  } else if (attempt.knowledgeLayers && attempt.knowledgeLayers.length > 1) {
    next = next.in("knowledge_layer", attempt.knowledgeLayers);
  }

  if (attempt.sourceType) {
    next = next.eq("source_type", attempt.sourceType);
  }

  if (attempt.errorType) {
    next = next.eq("error_type", attempt.errorType);
  }

  if (attempt.verifiedOnly) {
    next = next.eq("verified", true);
  }

  return next;
}

async function fetchKeywordRows(
  supabase: SupabaseServerClient,
  searchTerms: string[],
  attempt: RetrievalAttempt,
) {
  if (searchTerms.length === 0) {
    return [] as KnowledgeEntryRow[];
  }

  const baseQuery = supabase
    .from("rag_knowledge_entries")
    .select(
      "knowledge_layer, source_table, source_id, title, error_type, keywords, log_excerpt, root_cause, solution, source_type, verified, updated_at, source_label, cluster_key, priority",
    )
    .or(buildKeywordOrQuery(searchTerms))
    .limit(MAX_KEYWORD_ROWS);

  const { data, error } = await applyViewFilters(baseQuery, attempt);
  if (error || !data) {
    return [] as KnowledgeEntryRow[];
  }

  return data as KnowledgeEntryRow[];
}

async function resolveKeywordKnowledgeCases(
  supabase: SupabaseServerClient,
  queryTerms: QueryTerms,
  knowledgeLayers?: KnowledgeLayer[],
) {
  const attempts = buildRetrievalAttempts(queryTerms, knowledgeLayers);
  const buckets: RankedRetrievedCase[][] = [];

  for (const attempt of attempts) {
    const rows = await fetchKeywordRows(supabase, queryTerms.searchTerms, attempt);
    const ranked = rows
      .map((row) => {
        const lexicalScore = scoreKnowledgeRow(row, queryTerms);
        return {
          row,
          lexicalScore,
          sourceAligned: matchesSourceDomain(row, queryTerms.sourceType),
          errorAligned: matchesErrorType(row, queryTerms.errorType),
        };
      })
      .filter((item) => {
        if (item.row.knowledge_layer === "historical_missed") {
          return item.lexicalScore >= MIN_KEYWORD_SCORE - 1;
        }

        return item.lexicalScore >= MIN_KEYWORD_SCORE && (item.sourceAligned || item.errorAligned || item.row.knowledge_layer === "ops_experience");
      })
      .sort(
        (a, b) =>
          b.lexicalScore - a.lexicalScore ||
          LAYER_BOOSTS[b.row.knowledge_layer] - LAYER_BOOSTS[a.row.knowledge_layer] ||
          a.row.title.localeCompare(b.row.title),
      )
      .slice(0, MAX_CONTEXT_ITEMS)
      .map(({ row, lexicalScore }) =>
        toRankedRetrievedCase({
          row,
          queryTerms,
          lexicalScore,
          similarityScore: null,
        }),
      );

    buckets.push(ranked);

    if (mergeRetrievedCases(...buckets).length >= MIN_VECTOR_LEXICAL_SCORE) {
      break;
    }
  }

  return mergeRetrievedCases(...buckets);
}

async function fetchVectorRows(
  supabase: SupabaseServerClient,
  queryEmbedding: number[],
  attempt: RetrievalAttempt,
) {
  const { data, error } = await supabase.rpc("match_rag_knowledge_entries", {
    query_embedding: queryEmbedding,
    match_count: MAX_VECTOR_ROWS,
    knowledge_layers: attempt.knowledgeLayers ?? null,
    source_type_filter: attempt.sourceType ?? null,
    error_type_filter: attempt.errorType ?? null,
    verified_only: attempt.verifiedOnly,
  });

  if (error || !data) {
    return [] as VectorKnowledgeEntryRow[];
  }

  return data as VectorKnowledgeEntryRow[];
}

async function resolveVectorKnowledgeCases(
  supabase: SupabaseServerClient,
  input: IncidentAnalysisInput,
  queryTerms: QueryTerms,
  knowledgeLayers?: KnowledgeLayer[],
) {
  if (!hasEmbeddingConfig()) {
    return [] as RankedRetrievedCase[];
  }

  const embeddingInput = buildEmbeddingInput(
    [input.sourceType, input.incident.ruleName, input.incident.errorType, input.incident.rawText],
    { maxLength: MAX_EMBEDDING_INPUT_LENGTH },
  );
  const embedding = await embedText(embeddingInput);

  if (!embedding) {
    return [] as RankedRetrievedCase[];
  }

  const attempts = buildRetrievalAttempts(queryTerms, knowledgeLayers);
  const buckets: RankedRetrievedCase[][] = [];

  for (const attempt of attempts) {
    const rows = await fetchVectorRows(supabase, embedding, attempt);
    const ranked = rows
      .map((row) => {
        const lexicalScore = scoreKnowledgeRow(row, queryTerms);
        return {
          row,
          lexicalScore,
          similarity: row.similarity ?? 0,
          sourceAligned: matchesSourceDomain(row, queryTerms.sourceType),
          errorAligned: matchesErrorType(row, queryTerms.errorType),
        };
      })
      .filter((item) => {
        if (item.row.knowledge_layer === "historical_missed") {
          return item.similarity >= MIN_VECTOR_SIMILARITY - 0.05;
        }

        return item.similarity >= MIN_VECTOR_SIMILARITY && (item.lexicalScore >= MIN_VECTOR_LEXICAL_SCORE || item.sourceAligned || item.errorAligned);
      })
      .sort(
        (a, b) =>
          (b.similarity + b.lexicalScore / 100) - (a.similarity + a.lexicalScore / 100) ||
          LAYER_BOOSTS[b.row.knowledge_layer] - LAYER_BOOSTS[a.row.knowledge_layer] ||
          a.row.title.localeCompare(b.row.title),
      )
      .slice(0, MAX_CONTEXT_ITEMS)
      .map(({ row, lexicalScore, similarity }) =>
        toRankedRetrievedCase({
          row,
          queryTerms,
          lexicalScore,
          similarityScore: similarity,
        }),
      );

    buckets.push(ranked);

    if (mergeRetrievedCases(...buckets).length >= 3) {
      break;
    }
  }

  return mergeRetrievedCases(...buckets);
}

export async function resolveHistoricalMissedCaseCandidates(
  input: IncidentAnalysisInput,
): Promise<RagRetrievedCase[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createClient();
  const queryTerms = buildQueryTerms(input);
  const [keywordCases, vectorCases] = await Promise.all([
    resolveKeywordKnowledgeCases(supabase, queryTerms, ["historical_missed"]),
    resolveVectorKnowledgeCases(supabase, input, queryTerms, ["historical_missed"]),
  ]);

  return mergeRetrievedCases(keywordCases, vectorCases).map(stripRetrievedCaseMetadata);
}

export async function resolveRagResult(input: IncidentAnalysisInput): Promise<RagResult> {
  const startedAt = Date.now();
  const queryTerms = buildQueryTerms(input);
  const incidentId = typeof (input.incident as { incidentId?: unknown }).incidentId === "string"
    ? ((input.incident as { incidentId?: string }).incidentId ?? "")
    : "";

  if (!hasSupabaseEnv()) {
    traceAnalysisStage("rag_resolve_result", {
      sourceType: input.sourceType,
      errorType: input.incident.errorType,
      keywordCount: 0,
      vectorCount: 0,
      mergedCount: 0,
      elapsedMs: Date.now() - startedAt,
      skipped: "missing_supabase_env",
    });

    return {
      incidentId,
      querySummary: buildQuerySummary(queryTerms),
      retrievedCases: [],
    };
  }

  const supabase = await createClient();
  const [keywordCases, vectorCases] = await Promise.all([
    resolveKeywordKnowledgeCases(supabase, queryTerms),
    resolveVectorKnowledgeCases(supabase, input, queryTerms),
  ]);

  const retrievedCases = mergeRetrievedCases(keywordCases, vectorCases).map(stripRetrievedCaseMetadata);

  traceAnalysisStage("rag_resolve_result", {
    sourceType: input.sourceType,
    errorType: input.incident.errorType,
    keywordCount: keywordCases.length,
    vectorCount: vectorCases.length,
    mergedCount: retrievedCases.length,
    elapsedMs: Date.now() - startedAt,
  });

  return {
    incidentId,
    querySummary: buildQuerySummary(queryTerms),
    retrievedCases,
  };
}

export async function resolveKnowledgeBaseContext(
  input: IncidentAnalysisInput,
  options: ResolveKnowledgeBaseContextOptions = {},
): Promise<RagContextItem[]> {
  const startedAt = Date.now();
  const queryTerms = buildQueryTerms(input);

  if (!hasSupabaseEnv()) {
    traceAnalysisStage("rag_resolve_context", {
      sourceType: input.sourceType,
      errorType: input.incident.errorType,
      keywordCount: 0,
      vectorCount: 0,
      mergedCount: 0,
      elapsedMs: Date.now() - startedAt,
      skipped: "missing_supabase_env",
    });

    return [];
  }

  const supabase = await createClient();
  const [keywordCases, vectorCases] = await Promise.all([
    resolveKeywordKnowledgeCases(supabase, queryTerms),
    resolveVectorKnowledgeCases(supabase, input, queryTerms),
  ]);
  const merged = mergeRetrievedCases(keywordCases, vectorCases);
  const selectedKnowledgeSet = Array.isArray(options.selectedKnowledgeIds)
    ? new Set(options.selectedKnowledgeIds)
    : null;
  const filtered = !selectedKnowledgeSet
    ? merged
    : merged.filter((item) =>
        item.sourceTable !== "knowledge_base" || (item.sourceId ? selectedKnowledgeSet.has(item.sourceId) : false),
      );

  traceAnalysisStage("rag_resolve_context", {
    sourceType: input.sourceType,
    errorType: input.incident.errorType,
    keywordCount: keywordCases.length,
    vectorCount: vectorCases.length,
    mergedCount: filtered.length,
    selectedKnowledgeCount: selectedKnowledgeSet ? selectedKnowledgeSet.size : null,
    elapsedMs: Date.now() - startedAt,
  });

  return filtered.map(toLegacyRagContextItem);
}

