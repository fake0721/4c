# 分析链路最小可观测性埋点

## 目标
在不改表结构的前提下，为日志上传与分析链路增加阶段耗时和关键计数埋点，便于定位性能瓶颈。

## 开关
- 环境变量：`ANALYSIS_TRACE=1`
- 默认关闭，未开启时不输出埋点日志。

## 覆盖范围

### 1) 上传与分析主流程
文件：`lib/logs/upload-service.ts`

新增阶段：
- `file_read`
- `storage_upload`
- `rule_detection`
- `log_created`
- `incidents_inserted`
- `analysis_completed`
- `analysis_results_inserted`
- `review_rows_done`
- `workflow_completed`
- `workflow_failed`

主要字段：
- `logId`、`userId`、`analysisMode`
- `incidentCount`、`groupCount`、`llmGroupCount`、`ruleOnlyGroupCount`
- `elapsedMs`、`totalElapsedMs`

### 2) 编排层
文件：`lib/analysis/orchestrator.ts`

新增阶段：
- `orchestrator_analyze_incidents`
- `orchestrator_representative_groups`

主要字段：
- 输入数、分组数、LLM/规则分支数量、并发数、总耗时

### 3) RAG 检索层
文件：`lib/analysis/rag.ts`

新增阶段：
- `rag_resolve_result`
- `rag_resolve_context`

主要字段：
- `keywordCount`、`vectorCount`、`mergedCount`
- `sourceType`、`errorType`
- `elapsedMs`
- 当 Supabase 未配置时，记录 `skipped=missing_supabase_env`

## 兼容性
- 未修改数据库结构与 API schema。
- 未改变业务返回字段。

## 验证建议
1. 设置 `ANALYSIS_TRACE=1` 并重启服务。
2. 上传一份 300~500 行日志。
3. 在服务端日志中按 `[analysis-trace]` 过滤，查看各阶段耗时和数量。
4. 根据慢阶段继续做针对性优化（例如 RAG 召回、模型并发、入库批次）。
