# RAG 分层知识库 Refactor Notes

## 本轮目标

本轮只处理 RAG 层与知识库结构，目标是把当前单库混合检索升级为可持续扩展的分层知识库体系，并把历史漏报正式纳入主检索链路。

本轮遵守以下边界：

- 不改规则引擎
- 不改模型输出 schema
- 不大改前端知识库页面
- 优先复用现有 `knowledge_base`

## 对照结论

改造前的主要问题：

1. `knowledge_base` 字段不统一，无法稳定做元数据过滤
2. `historical_missed_cases` 只是预留，没有接入主 RAG 链路
3. 运维经验没有独立知识库
4. 检索流程没有真正形成“分层 + 过滤 + 粗召回 + 重排”的稳定结构

## 本轮实际修改

### 文档

- [docs/rag-layered-knowledge-spec.md](/c:/智能日志分析系统/next-app/docs/rag-layered-knowledge-spec.md)

### 代码

- [lib/analysis/rag.ts](/c:/智能日志分析系统/next-app/lib/analysis/rag.ts)
- [lib/analysis/missed-case-library.ts](/c:/智能日志分析系统/next-app/lib/analysis/missed-case-library.ts)
- [app/reviews/actions.ts](/c:/智能日志分析系统/next-app/app/reviews/actions.ts)
- [app/api/inner-data/route.ts](/c:/智能日志分析系统/next-app/app/api/inner-data/route.ts)

### SQL

- [supabase/phase-7-rag-layered-knowledge.sql](/c:/智能日志分析系统/next-app/supabase/phase-7-rag-layered-knowledge.sql)

## 本轮怎么做的

### 1. 三层知识库

本轮把 RAG 知识源分成三层：

- `exception_case`
  - 继续复用 `knowledge_base`
- `historical_missed`
  - 正式使用 `historical_missed_cases`
- `ops_experience`
  - 新增 `ops_experience_library`

### 2. 统一知识条目模板

三层知识源统一到这组主字段：

- `title`
- `error_type`
- `keywords`
- `log_excerpt`
- `root_cause`
- `solution`
- `source_type`
- `verified`
- `updated_at`

并额外补充：

- `cluster_key`
- `priority`
- `archived_at`
- `embedding`

### 3. 统一视图和向量匹配函数

新增统一视图：

- `rag_knowledge_entries`

新增统一 RPC：

- `match_rag_knowledge_entries(...)`

这样 RAG 层不再分别直连多个异构表，而是通过统一结构做：

- 元数据过滤
- 向量粗召回
- 关键词辅助过滤
- 重排

### 4. 主检索链路升级

`lib/analysis/rag.ts` 现在的主逻辑是：

1. 先生成 `QueryTerms`
2. 先做元数据过滤尝试
3. 走统一视图的关键词检索
4. 走统一 RPC 的向量粗召回
5. 按层级、验证状态、对齐度、相似度、priority、更新时间重排
6. 返回 top 5

重排时优先级顺序大致是：

- 历史漏报库
- 异常案例库
- 运维经验库

并叠加：

- `verified`
- `error_type` 对齐
- `source_type` 对齐
- lexical score
- similarity
- freshness

### 5. 漏报回流打通

新增了共享 helper：

- `syncHistoricalMissedCase(...)`

当人工复核完成且填写了根因或方案时，会把案例沉淀到 `historical_missed_cases`。

接入点包括：

- `app/reviews/actions.ts`
- `app/api/inner-data/route.ts` 的 `complete-review`

这意味着后续同类问题可以优先从历史漏报库命中。

### 6. 知识量增长后的结构准备

这轮已经为后续优化预留了结构位：

- `cluster_key`
  - 用于聚类去重
- `archived_at`
  - 用于低频归档
- `priority`
  - 用于人工经验和关键案例加权
- `verified`
  - 用于人工确认案例优先

## 本轮未处理项

- 没有改知识库前端管理页，暂时仍按旧字段展示
- 没有做大规模历史知识 embedding 回填
- 没有做查询缓存
- 没有把 `analysis_results.rag_context` 升级为完整结构化输出

## 验证情况

- `npx tsc --noEmit --tsBuildInfoFile .tsc-temp.tsbuildinfo` 通过

注意：

- `npm run build` 当前失败是现有 Google Font 联网问题，不是本轮代码的类型错误

## 后续建议

1. 给三层知识库补 embedding 回填脚本
2. 把知识库管理页升级到统一模板字段
3. 为 `rag_knowledge_entries` 增加查询缓存
4. 对历史漏报库做人工审核状态和回收策略
