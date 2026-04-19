# 字段规范说明

## 1. 目的

本文档只定义跨模块字段契约，明确以下四类接口：

- `RuleDetectionResult`
- `RagResult`
- `ModelAnalysisResult`
- `ReviewDecision`

约定：

- TypeScript 领域接口使用 `camelCase`
- 数据库字段继续使用 `snake_case`
- `incidentId` 统一指向当前系统里的 `log_errors.id`
- 现阶段先统一接口，再做数据库和 UI 适配

## 2. 当前仓库中的真实来源

当前主链路真实发生在 [app/logs/actions.ts](/c:/智能日志分析系统/next-app/app/logs/actions.ts)：

1. 上传日志并写入 `logs`
2. 规则检测并写入 `log_errors`
3. RAG 检索
4. LLM 或规则兜底分析
5. 写入 `analysis_results`
6. 对部分结果写入 `review_cases`

当前接口来源文件：

- Rule: [lib/rules/types.ts](/c:/智能日志分析系统/next-app/lib/rules/types.ts)
- RAG: [lib/analysis/types.ts](/c:/智能日志分析系统/next-app/lib/analysis/types.ts), [lib/analysis/rag.ts](/c:/智能日志分析系统/next-app/lib/analysis/rag.ts)
- Model: [lib/analysis/types.ts](/c:/智能日志分析系统/next-app/lib/analysis/types.ts), [lib/llm/types.ts](/c:/智能日志分析系统/next-app/lib/llm/types.ts)
- Review: [app/dashboard/reviews/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/reviews/page.tsx), [app/reviews/actions.ts](/c:/智能日志分析系统/next-app/app/reviews/actions.ts)

## 3. 统一接口定义

### 3.1 RuleDetectionResult

```ts
export interface RuleDetectionResult {
  incidentId: string;
  logId: string;
  sourceType: string;
  errorType: string;
  severity: "low" | "medium" | "high";
  matchedLines: number[];
  matchedKeywords: string[];
  snippet: string;
  sourceRuleIds: string[];
  ruleName?: string;
  rawText: string;
  detectedBy: "rule" | "rule+db";
}
```

字段说明：

| 字段 | 说明 | 当前映射 |
| --- | --- | --- |
| `incidentId` | 异常唯一 ID | 建议统一映射为 `log_errors.id` |
| `logId` | 日志任务 ID | `log_id` |
| `sourceType` | 日志来源类型 | `logs.source_type` |
| `errorType` | 异常类型 | `DetectedIncident.errorType` / `log_errors.error_type` |
| `severity` | 风险等级 | 当前等价物是 `riskLevel` / `risk_level` |
| `matchedLines` | 命中的日志行号列表 | 当前只有单值 `lineNumber` |
| `matchedKeywords` | 命中的关键词列表 | 当前未显式产出 |
| `snippet` | 用于展示的异常片段 | 当前可由 `rawText` 映射 |
| `sourceRuleIds` | 命中的规则 ID 列表 | 当前只有单值 `ruleId` |
| `ruleName` | 规则名称 | `DetectedIncident.ruleName` |
| `rawText` | 原始命中文本 | `DetectedIncident.rawText` |
| `detectedBy` | 检测来源 | 当前实际写入 `"rule"` |

兼容规则：

- 单行命中时：`matchedLines = [lineNumber]`
- 单规则命中时：`sourceRuleIds = [ruleId]`
- `snippet` 先直接使用 `rawText`

### 3.2 RagResult

```ts
export interface RagRetrievedCase {
  title: string;
  errorType: string | null;
  similarityScore: number | null;
  rootCause: string | null;
  repairSuggestion: string | null;
  sourceType: string | null;
  summary: string;
  source: string;
}

export interface RagResult {
  incidentId: string;
  querySummary: string;
  retrievedCases: RagRetrievedCase[];
}
```

字段说明：

| 字段 | 说明 | 当前映射 |
| --- | --- | --- |
| `incidentId` | 对应异常 ID | 当前未在 RAG 结构中携带 |
| `querySummary` | 本次检索的查询摘要 | 当前仅隐含在 query term 构造逻辑中 |
| `retrievedCases` | 结构化召回结果列表 | 当前等价物是 `ragContext[]`，但粒度不够 |

`RagRetrievedCase` 映射建议：

| 字段 | 当前映射 |
| --- | --- |
| `title` | `RagContextItem.title` / `knowledge_base.title` |
| `errorType` | 当前未结构化，可后续从 `category` 或标签归一 |
| `similarityScore` | 当前 `score` 不是纯 similarity，后续单独定义 |
| `rootCause` | `knowledge_base.possible_cause` |
| `repairSuggestion` | `knowledge_base.solution` |
| `sourceType` | 当前未结构化，后续从 `category` / `source` 映射 |
| `summary` | `RagContextItem.summary` |
| `source` | `RagContextItem.source` |

兼容规则：

- 过渡期保留当前 `ragContext` 供 Prompt 和 UI 使用
- 但对外契约统一写成 `RagResult`

### 3.3 ModelAnalysisResult

```ts
export interface ModelAnalysisResult {
  incidentId: string;
  cause: string;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  confidenceLevel: "low" | "medium" | "high";
  repairSuggestion: string;
  evidenceLines: number[];
  needsReview: boolean;
  providerUsed: string;
  modelName: string;
  latencyMs: number | null;
  tokensUsed: number;
  source: "rule" | "llm";
}
```

字段说明：

| 字段 | 说明 | 当前映射 |
| --- | --- | --- |
| `incidentId` | 对应异常 ID | 当前通过 `analysis_results.log_error_id` 关联 |
| `cause` | 原因判断 | `NormalizedAnalysisResult.cause` |
| `riskLevel` | 风险等级 | `NormalizedAnalysisResult.riskLevel` |
| `confidence` | 置信度 | `NormalizedAnalysisResult.confidence` |
| `confidenceLevel` | 置信度等级 | 当前未产出，建议由 `confidence` 派生 |
| `repairSuggestion` | 处理建议 | `NormalizedAnalysisResult.repairSuggestion` |
| `evidenceLines` | 证据行号 | 当前未产出，可先映射 `matchedLines` |
| `needsReview` | 是否进入人工复核 | 当前在 UI 页面临时计算 |
| `providerUsed` | provider 标识 | 当前等价物是 `providerId` |
| `modelName` | 模型名 | `NormalizedAnalysisResult.modelName` |
| `latencyMs` | 耗时 | `NormalizedAnalysisResult.latencyMs` |
| `tokensUsed` | token 消耗 | `NormalizedAnalysisResult.tokensUsed` |
| `source` | 结果来源 | `NormalizedAnalysisResult.source` |

推荐派生规则：

| 字段 | 规则 |
| --- | --- |
| `confidenceLevel` | `< 0.6 = low`，`0.6 ~ 0.8 = medium`，`>= 0.8 = high` |
| `needsReview` | `source === "rule"` 或 `riskLevel === "high"` 或 `confidence < 0.72` |
| `providerUsed` | 优先使用当前 `providerId` |

### 3.4 ReviewDecision

```ts
export interface ReviewDecision {
  incidentId: string;
  needsReview: boolean;
  reviewStatus: "pending" | "completed" | "skipped";
  reviewReasonCodes: string[];
  reviewNote: string | null;
  finalErrorType: string | null;
  finalRiskLevel: "low" | "medium" | "high" | null;
}
```

字段说明：

| 字段 | 说明 | 当前映射 |
| --- | --- | --- |
| `incidentId` | 对应异常 ID | `review_cases.log_error_id` |
| `needsReview` | 是否需要人工处理 | 当前由页面函数 `needsHumanReview(...)` 实时判断 |
| `reviewStatus` | 当前复核状态 | `review_cases.review_status` |
| `reviewReasonCodes` | 进入复核的原因码 | 当前未结构化 |
| `reviewNote` | 复核备注 | `review_cases.review_note` |
| `finalErrorType` | 复核后的异常类型 | `review_cases.final_error_type` |
| `finalRiskLevel` | 复核后的风险等级 | `review_cases.final_risk_level` |

推荐原因码：

- `rule_only_result`
- `high_risk`
- `low_confidence`
- `existing_review`
- `explicit_uncertain`
- `missing_analysis`

## 4. 四类接口与现有表结构的映射

| 接口 | 当前主要表 | 当前主要文件 |
| --- | --- | --- |
| `RuleDetectionResult` | `log_errors` | [lib/rules/engine.ts](/c:/智能日志分析系统/next-app/lib/rules/engine.ts), [app/logs/actions.ts](/c:/智能日志分析系统/next-app/app/logs/actions.ts) |
| `RagResult` | `knowledge_base`, `analysis_results.rag_context` | [lib/analysis/rag.ts](/c:/智能日志分析系统/next-app/lib/analysis/rag.ts) |
| `ModelAnalysisResult` | `analysis_results` | [lib/analysis/orchestrator.ts](/c:/智能日志分析系统/next-app/lib/analysis/orchestrator.ts), [lib/llm/providers/openai-compatible-provider.ts](/c:/智能日志分析系统/next-app/lib/llm/providers/openai-compatible-provider.ts) |
| `ReviewDecision` | `review_cases` | [app/dashboard/reviews/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/reviews/page.tsx), [app/reviews/actions.ts](/c:/智能日志分析系统/next-app/app/reviews/actions.ts) |

## 5. 当前差异

当前仓库和目标接口之间的关键差异：

| 接口 | 当前缺口 |
| --- | --- |
| `RuleDetectionResult` | 缺 `incidentId`、`matchedLines[]`、`matchedKeywords[]`、`sourceRuleIds[]` |
| `RagResult` | 当前只有 `ragContext[]`，没有 `querySummary` 和结构化 `retrievedCases[]` |
| `ModelAnalysisResult` | 缺 `confidenceLevel`、`evidenceLines`、`needsReview`、`providerUsed` |
| `ReviewDecision` | 当前没有统一接口，复核判定逻辑散落在 UI 页面 |

## 6. 结论

后续所有重构都应以这四类接口为边界：

- Rule 模块只负责产出 `RuleDetectionResult`
- RAG 模块只负责产出 `RagResult`
- Model 模块只负责产出 `ModelAnalysisResult`
- Orchestrator 负责汇总后产出 `ReviewDecision`

在这四类接口稳定之前，不建议直接修改页面字段或数据库字段命名。
