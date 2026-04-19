# Model Agent 第二轮重构说明

## 本轮目标

- 统一模型层返回结构，使其具备 `ModelAnalysisResult` 语义
- 保留现有主模型 `qwen-plus` 与备用模型 `qwen-flash` 的降级策略
- 下沉 `confidenceLevel` 与 `needsReview`，不再依赖 UI 层临时推导
- 不修改 `app/`、`components/`、`rag.ts`、`engine.ts`

## 实际修改文件

- `lib/analysis/orchestrator.ts`
- `docs/model-refactor-notes.md`

## 本轮未修改但已保留的逻辑

- `lib/llm/providers/openai-compatible-provider.ts`
  - 现有 `candidateModels = [config.model, config.fallbackModel]` 逻辑未改动
  - 仍保持主模型优先、失败后回退到备用模型的行为
  - 当前配置语义仍是 `LLM_MODEL -> qwen-plus`、`LLM_FALLBACK_MODEL -> qwen-flash`

## 兼容策略

本轮没有修改 `lib/analysis/types.ts` 和 `lib/llm/types.ts`，因此采用“扩展返回对象”的方式兼容旧调用方。

`analyzeIncidents()` 现在仍保留旧字段：

- `cause`
- `riskLevel`
- `confidence`
- `repairSuggestion`
- `ragContext`
- `modelName`
- `latencyMs`
- `tokensUsed`
- `providerId`
- `source`

同时新增 `ModelAnalysisResult` 语义字段：

- `incidentId`
- `confidenceLevel`
- `evidenceLines`
- `needsReview`
- `providerUsed`

因此现有 `app/logs/actions.ts` 无需修改，仍可继续读取旧字段；后续模块已经可以开始消费新字段。

## 新旧字段映射

| 新字段 | 当前来源 / 规则 |
| --- | --- |
| `incidentId` | 优先取 `input.incident.incidentId`，没有则返回空字符串 |
| `confidenceLevel` | `< 0.6 = low`，`0.6 <= x < 0.8 = medium`，`>= 0.8 = high` |
| `evidenceLines` | 优先取 `input.incident.matchedLines`，否则回退为 `[lineNumber]` |
| `needsReview` | `source === "rule"` 或 `riskLevel === "high"` 或 `confidence < 0.72` |
| `providerUsed` | 直接映射当前 `providerId` |

## 两条输出路径

### 1. LLM 成功路径

当 provider 可用且模型调用成功时，`orchestrator.ts` 会：

- 保留原有 `cause / riskLevel / confidence / repairSuggestion`
- 保留 `ragContext / modelName / latencyMs / tokensUsed / providerId / source`
- 同时补齐 `incidentId / confidenceLevel / evidenceLines / needsReview / providerUsed`

### 2. Rule fallback 路径

当没有 provider 或模型调用失败时，`buildRuleOnlyResult()` 现在也会返回同一套兼容字段，确保规则兜底与模型成功路径结构一致。

## 对业务结果的影响

- 不改变主链路分析模式选择
- 不改变 Rule fallback 行为
- 不改变主模型 / 备用模型选择顺序
- 不改变旧字段含义
- 只新增统一字段，供后续 Model / UI 重构使用

## 验证情况

- 已运行 `npx tsc --noEmit`
- 类型检查通过

## 未处理项

- `lib/analysis/types.ts` 仍未正式声明 `ModelAnalysisResult`
- `lib/llm/types.ts` 仍未显式携带新增模型层字段
- `app/` 侧尚未切换为直接消费 `confidenceLevel / needsReview / providerUsed`
- `incidentId` 仍依赖上游 incident 输入是否已携带该字段

## 下一轮建议

下一轮优先处理 RAG 与 Model 的边界，而不是 UI：

1. 评估 `rag.ts` 返回结构是否与 `RagResult` 完全对齐
2. 明确 `orchestrator` 如何稳定组合 Rule / RAG / Model 三类结果
3. 在 UI 改造前，先把 `needsReview` 从页面层判断迁移为统一数据字段
