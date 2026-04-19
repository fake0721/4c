# 重构计划

## 1. 目标

本计划只回答四件事：

1. 现有文件分别归属哪个模块
2. 哪些文件先不动
3. 哪些文件需要拆分
4. 重构顺序

当前回合只产出计划，不修改业务代码。

## 2. 现有文件归属

### 2.1 Orchestrator 模块

职责：串联上传、规则、RAG、模型、落库、复核。

文件归属：

- [app/logs/actions.ts](/c:/智能日志分析系统/next-app/app/logs/actions.ts)
- [lib/analysis/orchestrator.ts](/c:/智能日志分析系统/next-app/lib/analysis/orchestrator.ts)
- [lib/analysis/types.ts](/c:/智能日志分析系统/next-app/lib/analysis/types.ts)

### 2.2 Rule 模块

职责：规则定义、规则读取、规则命中。

文件归属：

- [lib/rules/types.ts](/c:/智能日志分析系统/next-app/lib/rules/types.ts)
- [lib/rules/engine.ts](/c:/智能日志分析系统/next-app/lib/rules/engine.ts)
- [lib/rules/default-rules.ts](/c:/智能日志分析系统/next-app/lib/rules/default-rules.ts)
- [lib/rules/db-rules.ts](/c:/智能日志分析系统/next-app/lib/rules/db-rules.ts)
- [app/rules/actions.ts](/c:/智能日志分析系统/next-app/app/rules/actions.ts)

### 2.3 RAG 模块

职责：知识库导入、Embedding、召回、重排。

文件归属：

- [lib/analysis/rag.ts](/c:/智能日志分析系统/next-app/lib/analysis/rag.ts)
- [lib/llm/embeddings.ts](/c:/智能日志分析系统/next-app/lib/llm/embeddings.ts)
- [app/imports/actions.ts](/c:/智能日志分析系统/next-app/app/imports/actions.ts)
- [lib/imports/normalize.ts](/c:/智能日志分析系统/next-app/lib/imports/normalize.ts)
- [lib/imports/types.ts](/c:/智能日志分析系统/next-app/lib/imports/types.ts)
- [scripts/backfill-knowledge-embeddings.mjs](/c:/智能日志分析系统/next-app/scripts/backfill-knowledge-embeddings.mjs)
- [supabase/phase-3-knowledge-import.sql](/c:/智能日志分析系统/next-app/supabase/phase-3-knowledge-import.sql)
- [supabase/phase-4-rag-vector-search.sql](/c:/智能日志分析系统/next-app/supabase/phase-4-rag-vector-search.sql)

### 2.4 Model 模块

职责：LLM Provider、Prompt、响应校验、规则兜底分析。

文件归属：

- [lib/llm/types.ts](/c:/智能日志分析系统/next-app/lib/llm/types.ts)
- [lib/llm/index.ts](/c:/智能日志分析系统/next-app/lib/llm/index.ts)
- [lib/llm/config.ts](/c:/智能日志分析系统/next-app/lib/llm/config.ts)
- [lib/llm/provider-registry.ts](/c:/智能日志分析系统/next-app/lib/llm/provider-registry.ts)
- [lib/llm/schema.ts](/c:/智能日志分析系统/next-app/lib/llm/schema.ts)
- [lib/llm/providers/openai-compatible-provider.ts](/c:/智能日志分析系统/next-app/lib/llm/providers/openai-compatible-provider.ts)
- [lib/llm/providers/mock-provider.ts](/c:/智能日志分析系统/next-app/lib/llm/providers/mock-provider.ts)
- [lib/analysis/rule-analysis.ts](/c:/智能日志分析系统/next-app/lib/analysis/rule-analysis.ts)

### 2.5 Review 模块

职责：复核入口、复核提交、复核状态展示。

文件归属：

- [app/reviews/actions.ts](/c:/智能日志分析系统/next-app/app/reviews/actions.ts)
- [app/dashboard/reviews/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/reviews/page.tsx)
- [components/dashboard/reviews-center.tsx](/c:/智能日志分析系统/next-app/components/dashboard/reviews-center.tsx)
- [supabase/phase-2-rules-and-review.sql](/c:/智能日志分析系统/next-app/supabase/phase-2-rules-and-review.sql)

### 2.6 UI / Dashboard 模块

职责：工作台、异常页、分析页、规则页、详情页展示。

文件归属：

- [app/dashboard/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/page.tsx)
- [app/dashboard/tasks/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/tasks/page.tsx)
- [app/dashboard/incidents/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/incidents/page.tsx)
- [app/dashboard/analyses/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/analyses/page.tsx)
- [app/dashboard/high-risk/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/high-risk/page.tsx)
- [app/dashboard/rules/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/rules/page.tsx)
- [app/dashboard/logs/[logId]/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/logs/[logId]/page.tsx)
- [components/dashboard/dashboard-shell.tsx](/c:/智能日志分析系统/next-app/components/dashboard/dashboard-shell.tsx)
- [components/dashboard/dashboard-overview.tsx](/c:/智能日志分析系统/next-app/components/dashboard/dashboard-overview.tsx)
- [components/dashboard/log-detail.tsx](/c:/智能日志分析系统/next-app/components/dashboard/log-detail.tsx)
- [components/dashboard/rules-center.tsx](/c:/智能日志分析系统/next-app/components/dashboard/rules-center.tsx)
- [components/dashboard/metric-card.tsx](/c:/智能日志分析系统/next-app/components/dashboard/metric-card.tsx)
- [components/dashboard/mode-comparison.tsx](/c:/智能日志分析系统/next-app/components/dashboard/mode-comparison.tsx)
- [components/dashboard/overview-charts.tsx](/c:/智能日志分析系统/next-app/components/dashboard/overview-charts.tsx)
- [components/dashboard/ring-chart.tsx](/c:/智能日志分析系统/next-app/components/dashboard/ring-chart.tsx)
- [components/dashboard/section-card.tsx](/c:/智能日志分析系统/next-app/components/dashboard/section-card.tsx)
- [components/dashboard/status-pill.tsx](/c:/智能日志分析系统/next-app/components/dashboard/status-pill.tsx)
- [lib/dashboard/overview.ts](/c:/智能日志分析系统/next-app/lib/dashboard/overview.ts)
- [lib/dashboard/benchmarks.ts](/c:/智能日志分析系统/next-app/lib/dashboard/benchmarks.ts)
- [lib/dashboard-data.ts](/c:/智能日志分析系统/next-app/lib/dashboard-data.ts)

### 2.7 Auth / Profile / Infra 模块

职责：登录、回调、账户、Supabase 连接、Profile 读取。

文件归属：

- [app/auth/actions.ts](/c:/智能日志分析系统/next-app/app/auth/actions.ts)
- [app/auth/password-actions.ts](/c:/智能日志分析系统/next-app/app/auth/password-actions.ts)
- [app/auth/callback/route.ts](/c:/智能日志分析系统/next-app/app/auth/callback/route.ts)
- [app/auth/reset-password/page.tsx](/c:/智能日志分析系统/next-app/app/auth/reset-password/page.tsx)
- [app/account/actions.ts](/c:/智能日志分析系统/next-app/app/account/actions.ts)
- [components/auth/auth-notice.tsx](/c:/智能日志分析系统/next-app/components/auth/auth-notice.tsx)
- [components/auth/submit-button.tsx](/c:/智能日志分析系统/next-app/components/auth/submit-button.tsx)
- [lib/supabase/browser-client.ts](/c:/智能日志分析系统/next-app/lib/supabase/browser-client.ts)
- [lib/supabase/server-client.ts](/c:/智能日志分析系统/next-app/lib/supabase/server-client.ts)
- [lib/supabase/middleware-client.ts](/c:/智能日志分析系统/next-app/lib/supabase/middleware-client.ts)
- [lib/supabase/env.ts](/c:/智能日志分析系统/next-app/lib/supabase/env.ts)
- [lib/supabase/profile.ts](/c:/智能日志分析系统/next-app/lib/supabase/profile.ts)
- [proxy.ts](/c:/智能日志分析系统/next-app/proxy.ts)

### 2.8 文档 / 数据资产 模块

职责：项目说明、技能说明、导入样本。

文件归属：

- [README.md](/c:/智能日志分析系统/next-app/README.md)
- [PROJECT_STATUS.md](/c:/智能日志分析系统/next-app/PROJECT_STATUS.md)
- [docs/skills/orchestrator-agent.md](/c:/智能日志分析系统/next-app/docs/skills/orchestrator-agent.md)
- [docs/skills/rule-agent.md](/c:/智能日志分析系统/next-app/docs/skills/rule-agent.md)
- [docs/skills/rag-agent.md](/c:/智能日志分析系统/next-app/docs/skills/rag-agent.md)
- [docs/skills/model-agent.md](/c:/智能日志分析系统/next-app/docs/skills/model-agent.md)
- [docs/skills/ui-agent.md](/c:/智能日志分析系统/next-app/docs/skills/ui-agent.md)
- [data/imports/README.md](/c:/智能日志分析系统/next-app/data/imports/README.md)
- [data/imports/knowledge-base-starter.json](/c:/智能日志分析系统/next-app/data/imports/knowledge-base-starter.json)
- [data/imports/sigma-import-ready-rules.json](/c:/智能日志分析系统/next-app/data/imports/sigma-import-ready-rules.json)
- [data/imports/sigma-system-service-rules.json](/c:/智能日志分析系统/next-app/data/imports/sigma-system-service-rules.json)
- [data/imports/sigma-deferred-network-rules.json](/c:/智能日志分析系统/next-app/data/imports/sigma-deferred-network-rules.json)

## 3. 哪些文件保留

以下文件建议在本轮重构中保留现有职责和结构，不做拆分，只在必要时做字段适配或调用侧调整。

### 3.1 Rule 模块内建议保留

- [lib/rules/default-rules.ts](/c:/智能日志分析系统/next-app/lib/rules/default-rules.ts)
- [app/rules/actions.ts](/c:/智能日志分析系统/next-app/app/rules/actions.ts)

原因：职责单一，分别负责内置规则定义和规则创建入口，不是当前边界混乱的主要来源。

### 3.2 RAG 模块内建议保留

- [lib/imports/normalize.ts](/c:/智能日志分析系统/next-app/lib/imports/normalize.ts)
- [lib/imports/types.ts](/c:/智能日志分析系统/next-app/lib/imports/types.ts)
- [app/imports/actions.ts](/c:/智能日志分析系统/next-app/app/imports/actions.ts)
- [scripts/backfill-knowledge-embeddings.mjs](/c:/智能日志分析系统/next-app/scripts/backfill-knowledge-embeddings.mjs)

原因：这些文件主要承担导入和辅助脚本职责，可继续复用，不需要随着第一轮边界整理一起重写。

### 3.3 Model 模块内建议保留

- [lib/llm/index.ts](/c:/智能日志分析系统/next-app/lib/llm/index.ts)
- [lib/llm/config.ts](/c:/智能日志分析系统/next-app/lib/llm/config.ts)
- [lib/llm/provider-registry.ts](/c:/智能日志分析系统/next-app/lib/llm/provider-registry.ts)
- [lib/llm/providers/mock-provider.ts](/c:/智能日志分析系统/next-app/lib/llm/providers/mock-provider.ts)

原因：这些文件职责相对清晰，当前问题主要不在 provider 注册层，而在输出契约和主编排入口。

### 3.4 UI 模块内建议保留

- [app/dashboard/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/page.tsx)
- [app/dashboard/tasks/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/tasks/page.tsx)
- [app/dashboard/incidents/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/incidents/page.tsx)
- [app/dashboard/analyses/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/analyses/page.tsx)
- [app/dashboard/high-risk/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/high-risk/page.tsx)
- [app/dashboard/rules/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/rules/page.tsx)
- [components/dashboard/dashboard-shell.tsx](/c:/智能日志分析系统/next-app/components/dashboard/dashboard-shell.tsx)
- [components/dashboard/dashboard-overview.tsx](/c:/智能日志分析系统/next-app/components/dashboard/dashboard-overview.tsx)
- [components/dashboard/metric-card.tsx](/c:/智能日志分析系统/next-app/components/dashboard/metric-card.tsx)
- [components/dashboard/mode-comparison.tsx](/c:/智能日志分析系统/next-app/components/dashboard/mode-comparison.tsx)
- [components/dashboard/overview-charts.tsx](/c:/智能日志分析系统/next-app/components/dashboard/overview-charts.tsx)
- [components/dashboard/ring-chart.tsx](/c:/智能日志分析系统/next-app/components/dashboard/ring-chart.tsx)
- [components/dashboard/section-card.tsx](/c:/智能日志分析系统/next-app/components/dashboard/section-card.tsx)
- [components/dashboard/status-pill.tsx](/c:/智能日志分析系统/next-app/components/dashboard/status-pill.tsx)
- [lib/dashboard/benchmarks.ts](/c:/智能日志分析系统/next-app/lib/dashboard/benchmarks.ts)

原因：这些页面或组件以展示和组装为主，当前不承担最核心的字段和编排问题，第一轮应尽量保持稳定。

## 4. 哪些文件暂时不动

第一轮重构先不动这些文件：

### 4.1 认证与基础设施

- [app/auth/actions.ts](/c:/智能日志分析系统/next-app/app/auth/actions.ts)
- [app/auth/password-actions.ts](/c:/智能日志分析系统/next-app/app/auth/password-actions.ts)
- [app/auth/callback/route.ts](/c:/智能日志分析系统/next-app/app/auth/callback/route.ts)
- [app/auth/reset-password/page.tsx](/c:/智能日志分析系统/next-app/app/auth/reset-password/page.tsx)
- [app/account/actions.ts](/c:/智能日志分析系统/next-app/app/account/actions.ts)
- [lib/supabase/browser-client.ts](/c:/智能日志分析系统/next-app/lib/supabase/browser-client.ts)
- [lib/supabase/server-client.ts](/c:/智能日志分析系统/next-app/lib/supabase/server-client.ts)
- [lib/supabase/middleware-client.ts](/c:/智能日志分析系统/next-app/lib/supabase/middleware-client.ts)
- [lib/supabase/env.ts](/c:/智能日志分析系统/next-app/lib/supabase/env.ts)
- [lib/supabase/profile.ts](/c:/智能日志分析系统/next-app/lib/supabase/profile.ts)
- [proxy.ts](/c:/智能日志分析系统/next-app/proxy.ts)

原因：这些文件和本次 Rule/RAG/Model/UI 边界统一关系不大，且当前功能相对稳定。

### 4.2 纯展示型小组件

- [components/dashboard/section-card.tsx](/c:/智能日志分析系统/next-app/components/dashboard/section-card.tsx)
- [components/dashboard/status-pill.tsx](/c:/智能日志分析系统/next-app/components/dashboard/status-pill.tsx)
- [components/dashboard/metric-card.tsx](/c:/智能日志分析系统/next-app/components/dashboard/metric-card.tsx)
- [components/dashboard/ring-chart.tsx](/c:/智能日志分析系统/next-app/components/dashboard/ring-chart.tsx)

原因：这些组件不承担字段契约问题，先不动。

### 4.3 数据样本与导入资产

- [data/imports](/c:/智能日志分析系统/next-app/data/imports)
- `supabase/import-*.sql`
- [scripts/backfill-knowledge-embeddings.mjs](/c:/智能日志分析系统/next-app/scripts/backfill-knowledge-embeddings.mjs)

原因：第一轮先统一接口和编排，不先碰导入资产。

## 5. 哪些文件要拆

### 5.1 必须优先拆分

#### [app/logs/actions.ts](/c:/智能日志分析系统/next-app/app/logs/actions.ts)

当前问题：

- 同时承担上传、规则检测、分组、RAG、模型调用、分析落库、复核抽样

建议拆分为：

- `upload-log.ts`
- `detect-incidents.ts`
- `group-incidents.ts`
- `run-rag.ts`
- `run-model-analysis.ts`
- `persist-analysis.ts`
- `build-review-decisions.ts`

#### [lib/analysis/rag.ts](/c:/智能日志分析系统/next-app/lib/analysis/rag.ts)

当前问题：

- Query term 构造、关键词检索、向量检索、重排、结果拼装全部塞在一个文件

建议拆分为：

- `rag-query.ts`
- `rag-keyword-retriever.ts`
- `rag-vector-retriever.ts`
- `rag-reranker.ts`
- `rag-mapper.ts`

#### [app/dashboard/reviews/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/reviews/page.tsx)

当前问题：

- 页面里包含 `needsHumanReview(...)` 业务判定

建议拆分为：

- 页面数据读取
- `review-decision-selector.ts`
- 页面展示 props 组装

### 5.2 第二批拆分

#### [components/dashboard/log-detail.tsx](/c:/智能日志分析系统/next-app/components/dashboard/log-detail.tsx)

当前问题：

- 展示逻辑复杂
- 字段假设和真实类型不一致
- 还混有乱码

建议拆分为：

- `log-detail-header.tsx`
- `log-detail-incidents.tsx`
- `log-detail-analyses.tsx`
- `log-detail-preview.tsx`

#### [components/dashboard/rules-center.tsx](/c:/智能日志分析系统/next-app/components/dashboard/rules-center.tsx)

当前问题：

- 规则创建表单和规则列表耦合
- 有旧原型文案和乱码

建议拆分为：

- `rule-create-form.tsx`
- `rule-list.tsx`

#### [lib/dashboard/overview.ts](/c:/智能日志分析系统/next-app/lib/dashboard/overview.ts)

当前问题：

- 同时做 error type、risk、mode 统计
- `analysis_mode` 枚举与真实数据不一致

建议拆分为：

- `overview-error-chart.ts`
- `overview-risk-chart.ts`
- `overview-mode-chart.ts`

## 6. 重构顺序

### Step 1：先落领域接口

先做：

- 对齐 [docs/field-spec.md](/c:/智能日志分析系统/next-app/docs/field-spec.md)
- 新增统一接口文件，例如 `lib/analysis/contracts.ts`

目标：

- 固定 `RuleDetectionResult`
- 固定 `RagResult`
- 固定 `ModelAnalysisResult`
- 固定 `ReviewDecision`

### Step 2：抽离 Orchestrator

先动：

- [app/logs/actions.ts](/c:/智能日志分析系统/next-app/app/logs/actions.ts)
- [lib/analysis/orchestrator.ts](/c:/智能日志分析系统/next-app/lib/analysis/orchestrator.ts)

目标：

- 把大函数拆成清晰阶段
- 让页面入口只保留 Server Action 边界

### Step 3：统一 Rule 输出

先动：

- [lib/rules/types.ts](/c:/智能日志分析系统/next-app/lib/rules/types.ts)
- [lib/rules/engine.ts](/c:/智能日志分析系统/next-app/lib/rules/engine.ts)
- [lib/rules/db-rules.ts](/c:/智能日志分析系统/next-app/lib/rules/db-rules.ts)

目标：

- 让规则层直接产出 `RuleDetectionResult`
- 明确 `incidentId`、`matchedLines`、`sourceRuleIds`

### Step 4：统一 RAG 输出

先动：

- [lib/analysis/rag.ts](/c:/智能日志分析系统/next-app/lib/analysis/rag.ts)
- [lib/llm/embeddings.ts](/c:/智能日志分析系统/next-app/lib/llm/embeddings.ts)

目标：

- 从 `ragContext[]` 升级成 `RagResult`

### Step 5：统一 Model 输出

先动：

- [lib/analysis/types.ts](/c:/智能日志分析系统/next-app/lib/analysis/types.ts)
- [lib/analysis/rule-analysis.ts](/c:/智能日志分析系统/next-app/lib/analysis/rule-analysis.ts)
- [lib/llm/types.ts](/c:/智能日志分析系统/next-app/lib/llm/types.ts)
- [lib/llm/schema.ts](/c:/智能日志分析系统/next-app/lib/llm/schema.ts)
- [lib/llm/providers/openai-compatible-provider.ts](/c:/智能日志分析系统/next-app/lib/llm/providers/openai-compatible-provider.ts)

目标：

- 统一产出 `ModelAnalysisResult`
- 下沉 `confidenceLevel` 和 `needsReview`

### Step 6：统一 ReviewDecision

先动：

- [app/dashboard/reviews/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/reviews/page.tsx)
- [app/reviews/actions.ts](/c:/智能日志分析系统/next-app/app/reviews/actions.ts)

目标：

- 页面不再自己定义复核判定
- 编排层直接产出 `ReviewDecision`

### Step 7：再改 UI 页面

先动：

- [app/dashboard/logs/[logId]/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/logs/[logId]/page.tsx)
- [components/dashboard/log-detail.tsx](/c:/智能日志分析系统/next-app/components/dashboard/log-detail.tsx)
- [app/dashboard/rules/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/rules/page.tsx)
- [components/dashboard/rules-center.tsx](/c:/智能日志分析系统/next-app/components/dashboard/rules-center.tsx)
- [app/dashboard/reviews/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/reviews/page.tsx)
- [components/dashboard/reviews-center.tsx](/c:/智能日志分析系统/next-app/components/dashboard/reviews-center.tsx)

目标：

- UI 改成只消费统一接口或 ViewModel

### Step 8：最后清理数据库和技术债

最后再动：

- 核心表建表 SQL
- `analysis_mode` 枚举不一致
- 乱码文件
- 原型遗留数据文件

原因：

- 在领域接口没稳定前，先改 SQL 和 UI 容易反复返工

## 7. 结论

第一阶段不要广撒网，重点应该放在：

1. 统一四类接口
2. 抽离 [app/logs/actions.ts](/c:/智能日志分析系统/next-app/app/logs/actions.ts)
3. 下沉 `needsReview`
4. 把 RAG 从上下文结构升级成结果结构

等这一步稳定后，再处理 UI 拆分、SQL 补齐和乱码清理。
