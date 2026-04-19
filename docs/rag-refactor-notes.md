# RAG Agent 第三轮重构说明

## 本轮目标

- 统一 RAG 层输出，使其具备 `RagResult` 语义
- 保留当前混合检索链路：关键词召回、pgvector、同域约束、精排
- 为历史漏报库预留独立接口，但不接入当前主业务链路
- 不修改 `engine.ts`、`openai-compatible-provider.ts`、`app/`、`components/`

## 实际修改文件

- `lib/analysis/rag.ts`
- `lib/llm/embeddings.ts`
- `supabase/phase-4-rag-vector-search.sql`
- `docs/rag-refactor-notes.md`

## 兼容策略

本轮没有修改 `lib/analysis/types.ts`，因此采用“双出口”兼容方式：

- 新增结构化出口：`resolveRagResult(input)`
  - 返回 `RagResult`
- 保留旧出口：`resolveKnowledgeBaseContext(input)`
  - 继续返回 `RagContextItem[]`

这样当前 `orchestrator` 和 `app/logs/actions.ts` 不需要改动，但 RAG 模块内部已经统一为结构化结果。

## 新增的结构化接口语义

### `RagResult`

- `incidentId`
- `querySummary`
- `retrievedCases[]`

### `RagRetrievedCase`

- `title`
- `errorType`
- `similarityScore`
- `rootCause`
- `repairSuggestion`
- `sourceType`
- `summary`
- `source`

## 保留的现有检索能力

以下逻辑本轮都保留，没有被移除：

- 关键词召回
  - 仍基于多字段 `ilike` 召回 `knowledge_base`
- pgvector 向量召回
  - 仍通过 `match_knowledge_base` RPC 完成
- 同域约束
  - 仍保留 `matchesSourceDomain()` 与 source hint 逻辑
- 精排
  - 仍保留 `scoreKnowledgeRow()`、error type alignment、combined score 逻辑
- 结果合并
  - 仍对 keyword/vector 结果去重、合并和截断

## 本轮结构调整

### 1. `rag.ts`

- 新增 `resolveRagResult()`，统一产出结构化 `RagResult`
- 将 keyword 检索与 vector 检索都先映射为结构化候选 case
- 在统一 merge 阶段完成：
  - 去重
  - rank score 合并
  - similarity 合并
  - summary/rootCause/repairSuggestion/sourceType/errorType 补齐
- `resolveKnowledgeBaseContext()` 改为复用相同的合并结果，再降级映射回旧 `RagContextItem[]`

### 2. `embeddings.ts`

- 保留现有 `embedText()` 行为不变
- 新增 `buildEmbeddingInput()`
  - 用于统一拼装 embedding 输入文本
  - 可复用于知识库检索与历史漏报库检索
  - 不改变当前 embedding 请求配置和维度逻辑

### 3. SQL 预留

在 `supabase/phase-4-rag-vector-search.sql` 中新增：

- `historical_missed_cases` 表
- `match_historical_missed_cases(...)` 函数

用途是为后续“历史漏报回灌 / 漏报记忆库”预留标准向量召回入口。

注意：

- 本轮没有把它接入当前主 RAG 检索链路
- 当前主链路仍只使用 `knowledge_base` + `match_knowledge_base`
- 这样可以保证现有业务结果不被改变

## 新旧字段映射

| 新字段 | 当前来源 |
| --- | --- |
| `incidentId` | 优先取 `input.incident.incidentId`，没有则空字符串 |
| `querySummary` | 基于 `sourceType / errorType / ruleName / phrases` 生成 |
| `retrievedCases[].title` | `knowledge_base.title` |
| `retrievedCases[].rootCause` | `knowledge_base.possible_cause` |
| `retrievedCases[].repairSuggestion` | `knowledge_base.solution` |
| `retrievedCases[].summary` | `symptom / possible_cause / solution` 组合 |
| `retrievedCases[].source` | `knowledge_base.source`，缺失则回退 `category` |
| `retrievedCases[].similarityScore` | 向量召回时取 `similarity`，关键词召回时为 `null` |
| `retrievedCases[].sourceType` | 基于 category/source/keywords 的 source hint 推断 |
| `retrievedCases[].errorType` | 优先按当前 errorType 对齐，否则按 row 内容 hint 推断 |

## 历史漏报库接口

本轮新增但未接主链路的接口：

- `resolveHistoricalMissedCaseCandidates(input)`

该接口会：

- 使用与主 RAG 相同的 embedding 生成能力
- 调用 `match_historical_missed_cases`
- 返回结构化 `RagRetrievedCase[]`

它目前只是预留能力，不参与当前 `resolveKnowledgeBaseContext()` 的结果。

## 对业务结果的影响

- 不改变 `app/logs/actions.ts` 的调用方式
- 不改变 `orchestrator` 的 RAG 输入形式
- 不改变当前 keyword + vector + rerank 主路径
- 不改变当前向量模型配置来源
- 只新增结构化出口与历史漏报库预留接口

## 验证情况

- 已运行 `npx tsc --noEmit`
- 类型检查通过

## 未处理项

- `lib/analysis/types.ts` 仍未正式声明 `RagResult`
- 当前 `orchestrator` 仍消费旧的 `RagContextItem[]`
- 历史漏报库尚未接入主排序链，也未接入人工复核回流流程
- `retrievedCases[].errorType/sourceType` 目前仍是基于文本 hint 的推断，不是数据库强字段

## 下一轮建议

下一轮优先处理 Orchestrator 对三类结构化结果的统一编排：

1. 让 orchestrator 显式接收 `RuleDetectionResult / RagResult / ModelAnalysisResult`
2. 把 `analysis_results.rag_context` 从旧 `RagContextItem[]` 过渡到结构化 `retrievedCases[]`
3. 再进入 UI 层，把当前页面级字段推导彻底下沉到数据层
