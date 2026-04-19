# Orchestrator 边界整理说明

## 本轮目标

- 缩小 `app/logs/actions.ts` 的职责面
- 将“分组、挑选 LLM、代表样本分析、双检抽样”迁回 `lib/analysis/orchestrator.ts`
- 保持上传、Supabase 落库、页面入口边界仍在 `app/`
- 不改变当前业务结果

## 实际修改文件

- `lib/analysis/orchestrator.ts`
- `app/logs/actions.ts`
- `docs/orchestrator-refactor-notes.md`

## 本轮抽回 Orchestrator 的逻辑

已从 `app/logs/actions.ts` 抽回：

- `createIncidentGroups()`
- `selectLlmGroupIndexes()`
- `buildRepresentativeAnalysisPlan()`
- `analyzeRepresentativeGroups()`
- `createDualCheckReviewRows()`
- 相关相似度、分组、双检判定辅助函数

## 保留在 `app/logs/actions.ts` 的边界

当前仍保留在 Server Action 入口：

- 上传文件与读取文本
- 调用 Rule 层检测
- 创建 `logs` / `log_errors` / `analysis_results` / `review_cases`
- 更新任务状态与页面跳转

这意味着页面入口已经不再直接承担核心分析编排算法，只保留 I/O 与落库边界。

## 兼容性说明

- `analysisMode` 仍保持 `rules_fast | hybrid | summarized_hybrid`
- 代表样本选择规则未改变
- dual-check 抽样逻辑未改变
- `analyzeIncidents()` 的调用方式保持兼容
- `resolveKnowledgeBaseContext` 仍由调用方注入，不在 `orchestrator` 中硬编码依赖 `rag.ts`

## 当前收益

- `app/logs/actions.ts` 的非 I/O 逻辑明显减少
- Orchestrator 现在更接近“真正的编排层”职责
- 下一轮更容易继续下沉 `ReviewDecision`
- 后续也更容易继续拆 `persist-analysis` 和 `build-review-decisions`

## 验证情况

- 已运行 `npx tsc --noEmit`
- 类型检查通过

## 下一步建议

继续做编排层第四步时，优先处理两件事：

1. 让 orchestrator 显式返回结构化 `ReviewDecision`
2. 再把 `analysis_results` / `review_cases` 的构造从 `app/logs/actions.ts` 进一步抽离
