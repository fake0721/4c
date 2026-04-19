# 历史漏报库运营指南

## 目标

把 `historical_missed_cases` 从“已经接上但暂时为空”的预留库，补成可运营、可回补、可优先检索的正式漏报库。

## 漏报库的定位

`historical_missed_cases` 不是普通知识库副本，也不是人工复核记录表。

它只保存一类内容：

- 人工复核确认过
- 对同类问题再次出现有明显复用价值
- 应优先于普通案例库被召回

## 入库口径

满足以下条件时，应该沉淀到漏报库：

1. 规则未命中或命中不准
2. 模型结论明显偏离
3. 人工已经补出了根因、修复方案，或至少补出了可复用根因
4. 同类问题未来仍可能重复出现

不建议沉淀的情况：

- 一次性偶发问题，且没有复用价值
- 只有“已确认有问题”，但没有任何根因或方案
- 与现有漏报案例高度重复，且没有新增信息

## 当前自动沉淀规则

### 1. 表单复核入口

当用户通过复核表单提交：

- `issueSpot`
- `resolution`

且复核状态不是跳过时，系统会自动尝试沉淀到 `historical_missed_cases`。

### 2. API 完成复核入口

当内部 API 执行 `complete-review` 时：

- 会先把 `review_cases` 标记为 `completed`
- 再优先读取 `final_cause / resolution`
- 如果没有，再回退到 `review_note`
- 仍然没有时，再回退到最近一条 `analysis_results.cause / repair_suggestion`

这样可以避免“复核已完成，但漏报库没有沉淀”的断链。

## 回补策略

为了解决历史数据在早期没有及时沉淀的问题，系统保留了回补能力：

- 允许按用户维度扫描 `review_cases.review_status = completed`
- 按最新复核结论和分析结果批量回补到 `historical_missed_cases`

这个动作适合在以下场景执行：

- 新上线漏报库时补历史数据
- 修复自动沉淀逻辑后补漏
- 大批量人工复核完成后做集中同步

## 查询视图

漏报库现在应该具备独立查询视图，而不是只混在复核记录中。

建议的关注字段：

- `title`
- `error_type`
- `source_type`
- `log_excerpt`
- `root_cause`
- `solution`
- `verified`
- `updated_at`
- `priority`

## 与其他库的边界

### 与 `review_cases` 的区别

- `review_cases` 是过程记录
- `historical_missed_cases` 是知识资产

### 与 `knowledge_base` 的区别

- `knowledge_base` 是标准异常案例库
- `historical_missed_cases` 是“曾经漏掉过”的优先召回库

### 与 `ops_experience_library` 的区别

- `ops_experience_library` 偏运行手册和排查经验
- `historical_missed_cases` 偏真实错判/漏判后的纠偏案例

## 运营建议

### 1. 每周复盘一次

重点看：

- 本周新增多少 `completed review`
- 本周新增多少 `historical_missed_cases`
- 有没有“复核已完成但未入漏报库”的异常

### 2. 先保证质量，不追求数量

漏报库的价值在于：

- 同类问题下一次不再漏

所以优先标准是可复用、可检索、可解释，不是条目越多越好。

### 3. 与主知识库配合

如果某条漏报案例：

- 已经反复出现
- 已经比较稳定
- 不再只属于“漏报纠偏”

后续可以再晋升到 `knowledge_base`，变成通用标准案例。

## 当前验收口径

漏报库建设完成，不看“现在是不是有很多数据”，而看下面四件事是否成立：

1. 复核完成后会自动尝试沉淀
2. 历史 completed review 可以回补
3. 漏报库有独立查询入口
4. RAG 检索时漏报库优先级高于普通案例库
