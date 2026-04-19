# 文件归属说明

## 1. 目的与归属规则

本文档用于明确当前仓库中四个核心模块的关键文件主责归属：

- Rule Agent
- RAG Agent
- Model Agent
- UI Agent

归属规则：

- 采用主责归属，每个文件只出现一次
- 对跨模块文件，在“当前作用”中写明协作边界
- 只覆盖这四个 Agent 直连的关键文件
- 不纳入 Auth、Supabase 基础设施、通用文档、静态资源

状态判定规则：

- `是否需要重构 = 是`
  - 文件承担多类职责
  - 文件字段与 [docs/field-spec.md](/c:/智能日志分析系统/next-app/docs/field-spec.md) 不一致
  - 文件在 [docs/refactor-plan.md](/c:/智能日志分析系统/next-app/docs/refactor-plan.md) 中被列为需要拆分或重点改造
  - 文件包含明显乱码、旧原型逻辑、枚举不一致
- `是否需要重构 = 否`
  - 文件职责单一
  - 当前主要提供稳定配置、纯展示、纯导入类型或纯 SQL 支撑
- `是否为高优先级 = 是`
  - 文件位于主链路
  - 文件决定跨模块字段契约
  - 文件当前承担错误的业务归属
  - 文件在重构计划中已被列为优先拆分或优先改造

## 2. 范围说明

本文件与以下文档保持一致：

- [docs/field-spec.md](/c:/智能日志分析系统/next-app/docs/field-spec.md)
- [docs/refactor-plan.md](/c:/智能日志分析系统/next-app/docs/refactor-plan.md)

特殊归属约定：

- [app/logs/actions.ts](/c:/智能日志分析系统/next-app/app/logs/actions.ts) 归 Model Agent，因为它当前主责是产出分析结果与复核决策，但其实现同时协作 Rule、RAG、UI
- [lib/analysis/types.ts](/c:/智能日志分析系统/next-app/lib/analysis/types.ts) 归 Model Agent，因为它当前承载分析链输入输出契约
- [app/reviews/actions.ts](/c:/智能日志分析系统/next-app/app/reviews/actions.ts) 归 UI Agent，因为当前它服务的是人工复核交互入口，不单列 Review 模块

## 3. Rule Agent

| 文件 | 当前作用 | 是否需要重构 | 是否为高优先级 |
| --- | --- | --- | --- |
| [lib/rules/types.ts](/c:/智能日志分析系统/next-app/lib/rules/types.ts) | 定义 `DetectionRule` 和 `DetectedIncident`，是规则层字段契约入口 | 是 | 是 |
| [lib/rules/engine.ts](/c:/智能日志分析系统/next-app/lib/rules/engine.ts) | 执行规则匹配、过滤堆栈噪音、产出命中 incident | 是 | 是 |
| [lib/rules/default-rules.ts](/c:/智能日志分析系统/next-app/lib/rules/default-rules.ts) | 维护内置默认规则库 | 否 | 否 |
| [lib/rules/db-rules.ts](/c:/智能日志分析系统/next-app/lib/rules/db-rules.ts) | 读取数据库动态规则并映射为规则引擎可消费结构 | 是 | 是 |
| [app/rules/actions.ts](/c:/智能日志分析系统/next-app/app/rules/actions.ts) | 处理手工创建规则的 Server Action，服务规则沉淀入口 | 否 | 否 |
| [supabase/phase-2-rules-and-review.sql](/c:/智能日志分析系统/next-app/supabase/phase-2-rules-and-review.sql) | 定义 `detection_rules` 和 `review_cases` 相关表及策略，规则库 schema 真源之一 | 是 | 否 |

## 4. RAG Agent

| 文件 | 当前作用 | 是否需要重构 | 是否为高优先级 |
| --- | --- | --- | --- |
| [lib/analysis/rag.ts](/c:/智能日志分析系统/next-app/lib/analysis/rag.ts) | 承担 query terms 构造、关键词检索、向量检索、重排和 RAG 上下文拼装 | 是 | 是 |
| [lib/llm/embeddings.ts](/c:/智能日志分析系统/next-app/lib/llm/embeddings.ts) | 调用 embedding 接口，为向量检索提供向量输入 | 是 | 是 |
| [app/imports/actions.ts](/c:/智能日志分析系统/next-app/app/imports/actions.ts) | 处理规则和知识库导入动作，其中知识导入部分服务 RAG 数据准备 | 否 | 否 |
| [lib/imports/normalize.ts](/c:/智能日志分析系统/next-app/lib/imports/normalize.ts) | 规范化规则导入和知识库导入 payload | 否 | 否 |
| [lib/imports/types.ts](/c:/智能日志分析系统/next-app/lib/imports/types.ts) | 定义导入归一化类型 | 否 | 否 |
| [scripts/backfill-knowledge-embeddings.mjs](/c:/智能日志分析系统/next-app/scripts/backfill-knowledge-embeddings.mjs) | 为知识库条目回填 embedding，支撑向量检索 | 否 | 否 |
| [supabase/phase-3-knowledge-import.sql](/c:/智能日志分析系统/next-app/supabase/phase-3-knowledge-import.sql) | 定义知识库相关权限策略 | 否 | 否 |
| [supabase/phase-4-rag-vector-search.sql](/c:/智能日志分析系统/next-app/supabase/phase-4-rag-vector-search.sql) | 定义 `knowledge_base.embedding`、向量索引和 `match_knowledge_base(...)` | 是 | 是 |

## 5. Model Agent

| 文件 | 当前作用 | 是否需要重构 | 是否为高优先级 |
| --- | --- | --- | --- |
| [app/logs/actions.ts](/c:/智能日志分析系统/next-app/app/logs/actions.ts) | 当前分析主链路入口，负责上传后编排 Rule、RAG、Model、落库与复核抽样 | 是 | 是 |
| [lib/analysis/orchestrator.ts](/c:/智能日志分析系统/next-app/lib/analysis/orchestrator.ts) | 负责并发调用分析 provider 并统一返回分析结果 | 是 | 是 |
| [lib/analysis/types.ts](/c:/智能日志分析系统/next-app/lib/analysis/types.ts) | 定义分析输入输出类型，是当前分析契约核心文件 | 是 | 是 |
| [lib/analysis/rule-analysis.ts](/c:/智能日志分析系统/next-app/lib/analysis/rule-analysis.ts) | 提供规则兜底分析草稿，服务无模型或模型失败场景 | 是 | 否 |
| [lib/llm/types.ts](/c:/智能日志分析系统/next-app/lib/llm/types.ts) | 定义 LLM provider、请求和响应类型 | 是 | 否 |
| [lib/llm/index.ts](/c:/智能日志分析系统/next-app/lib/llm/index.ts) | 汇总导出 LLM 配置和 provider 接口 | 否 | 否 |
| [lib/llm/config.ts](/c:/智能日志分析系统/next-app/lib/llm/config.ts) | 解析模型 provider、模型名和超时等运行配置 | 否 | 否 |
| [lib/llm/provider-registry.ts](/c:/智能日志分析系统/next-app/lib/llm/provider-registry.ts) | 根据配置选择实际 provider | 否 | 否 |
| [lib/llm/schema.ts](/c:/智能日志分析系统/next-app/lib/llm/schema.ts) | 校验并归一化模型返回 JSON 结构 | 是 | 是 |
| [lib/llm/providers/openai-compatible-provider.ts](/c:/智能日志分析系统/next-app/lib/llm/providers/openai-compatible-provider.ts) | 构造 Prompt、发起模型请求、解析响应，是当前主模型实现 | 是 | 是 |
| [lib/llm/providers/mock-provider.ts](/c:/智能日志分析系统/next-app/lib/llm/providers/mock-provider.ts) | 提供无真实模型时的兜底 provider | 否 | 否 |

## 6. UI Agent

| 文件 | 当前作用 | 是否需要重构 | 是否为高优先级 |
| --- | --- | --- | --- |
| [app/dashboard/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/page.tsx) | Dashboard 总览页，读取汇总数据并组装概览视图 | 否 | 否 |
| [app/dashboard/tasks/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/tasks/page.tsx) | 展示日志任务列表和基础管理入口 | 否 | 否 |
| [app/dashboard/incidents/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/incidents/page.tsx) | 展示规则命中的异常明细 | 否 | 否 |
| [app/dashboard/analyses/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/analyses/page.tsx) | 展示已完成分析结果列表 | 否 | 否 |
| [app/dashboard/high-risk/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/high-risk/page.tsx) | 展示高风险分析结果 | 否 | 否 |
| [app/dashboard/rules/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/rules/page.tsx) | 规则管理页入口，连接规则页数据与视图 | 否 | 否 |
| [app/dashboard/reviews/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/reviews/page.tsx) | 复核页入口，当前还在页面层计算 `needsHumanReview(...)` | 是 | 是 |
| [app/dashboard/logs/[logId]/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/logs/[logId]/page.tsx) | 单日志详情页入口，组装异常、分析和预览数据 | 是 | 是 |
| [app/reviews/actions.ts](/c:/智能日志分析系统/next-app/app/reviews/actions.ts) | 处理人工复核提交和跳过动作，服务复核交互流程 | 否 | 否 |
| [components/dashboard/dashboard-shell.tsx](/c:/智能日志分析系统/next-app/components/dashboard/dashboard-shell.tsx) | Dashboard 公共布局和导航骨架 | 否 | 否 |
| [components/dashboard/dashboard-overview.tsx](/c:/智能日志分析系统/next-app/components/dashboard/dashboard-overview.tsx) | 总览页核心展示组件 | 否 | 否 |
| [components/dashboard/reviews-center.tsx](/c:/智能日志分析系统/next-app/components/dashboard/reviews-center.tsx) | 承载人工复核主视图和规则沉淀交互区域 | 是 | 是 |
| [components/dashboard/rules-center.tsx](/c:/智能日志分析系统/next-app/components/dashboard/rules-center.tsx) | 承载规则创建表单和规则列表，当前仍有耦合与乱码问题 | 是 | 是 |
| [components/dashboard/log-detail.tsx](/c:/智能日志分析系统/next-app/components/dashboard/log-detail.tsx) | 承载日志详情头部、异常、分析和原始预览展示，当前逻辑偏重且存在乱码 | 是 | 是 |
| [components/dashboard/metric-card.tsx](/c:/智能日志分析系统/next-app/components/dashboard/metric-card.tsx) | 纯展示型指标卡组件 | 否 | 否 |
| [components/dashboard/mode-comparison.tsx](/c:/智能日志分析系统/next-app/components/dashboard/mode-comparison.tsx) | 展示模式对比图表 | 否 | 否 |
| [components/dashboard/overview-charts.tsx](/c:/智能日志分析系统/next-app/components/dashboard/overview-charts.tsx) | 展示总览图表区域 | 否 | 否 |
| [components/dashboard/ring-chart.tsx](/c:/智能日志分析系统/next-app/components/dashboard/ring-chart.tsx) | 纯展示型环形图组件 | 否 | 否 |
| [components/dashboard/section-card.tsx](/c:/智能日志分析系统/next-app/components/dashboard/section-card.tsx) | 纯展示型分区卡片组件 | 否 | 否 |
| [components/dashboard/status-pill.tsx](/c:/智能日志分析系统/next-app/components/dashboard/status-pill.tsx) | 纯展示型状态标签组件 | 否 | 否 |
| [lib/dashboard/overview.ts](/c:/智能日志分析系统/next-app/lib/dashboard/overview.ts) | 构建总览图表数据，当前 `analysis_mode` 枚举与真实写库值不一致 | 是 | 是 |
| [lib/dashboard/benchmarks.ts](/c:/智能日志分析系统/next-app/lib/dashboard/benchmarks.ts) | 提供模式对比展示基准数据 | 否 | 否 |
| [lib/dashboard-data.ts](/c:/智能日志分析系统/next-app/lib/dashboard-data.ts) | 保留旧原型静态展示数据，当前仍有乱码和原型残留 | 是 | 否 |

## 7. 高优先级汇总

以下文件属于第一轮边界重构的高优先级对象：

### Rule Agent

- [lib/rules/types.ts](/c:/智能日志分析系统/next-app/lib/rules/types.ts)
- [lib/rules/engine.ts](/c:/智能日志分析系统/next-app/lib/rules/engine.ts)
- [lib/rules/db-rules.ts](/c:/智能日志分析系统/next-app/lib/rules/db-rules.ts)

### RAG Agent

- [lib/analysis/rag.ts](/c:/智能日志分析系统/next-app/lib/analysis/rag.ts)
- [lib/llm/embeddings.ts](/c:/智能日志分析系统/next-app/lib/llm/embeddings.ts)
- [supabase/phase-4-rag-vector-search.sql](/c:/智能日志分析系统/next-app/supabase/phase-4-rag-vector-search.sql)

### Model Agent

- [app/logs/actions.ts](/c:/智能日志分析系统/next-app/app/logs/actions.ts)
- [lib/analysis/orchestrator.ts](/c:/智能日志分析系统/next-app/lib/analysis/orchestrator.ts)
- [lib/analysis/types.ts](/c:/智能日志分析系统/next-app/lib/analysis/types.ts)
- [lib/llm/schema.ts](/c:/智能日志分析系统/next-app/lib/llm/schema.ts)
- [lib/llm/providers/openai-compatible-provider.ts](/c:/智能日志分析系统/next-app/lib/llm/providers/openai-compatible-provider.ts)

### UI Agent

- [app/dashboard/reviews/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/reviews/page.tsx)
- [app/dashboard/logs/[logId]/page.tsx](/c:/智能日志分析系统/next-app/app/dashboard/logs/[logId]/page.tsx)
- [components/dashboard/reviews-center.tsx](/c:/智能日志分析系统/next-app/components/dashboard/reviews-center.tsx)
- [components/dashboard/rules-center.tsx](/c:/智能日志分析系统/next-app/components/dashboard/rules-center.tsx)
- [components/dashboard/log-detail.tsx](/c:/智能日志分析系统/next-app/components/dashboard/log-detail.tsx)
- [lib/dashboard/overview.ts](/c:/智能日志分析系统/next-app/lib/dashboard/overview.ts)
