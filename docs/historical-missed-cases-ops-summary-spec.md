# 历史漏报库运营摘要规范

## 目标

为 `historical_missed_cases` 提供一组独立的运营摘要视图，解决“漏报库链路已经接上，但当前增长情况、回补状态和复核进度不可见”的问题。

## 设计原则

1. 不修改现有规则逻辑
2. 不强制改前端页面
3. 先通过 `app/api/inner-data` 增加独立查询视图
4. 优先复用现有表：
   - `review_cases`
   - `analysis_results`
   - `historical_missed_cases`

## 视图目标

新增运营摘要视图后，至少能回答以下问题：

1. 当前总共有多少待复核案例
2. 当前总共有多少已完成复核案例
3. 当前已完成复核中，有多少具备回补漏报库的条件
4. 当前漏报库已有多少条
5. 最近哪些复核案例最可能成为首批漏报沉淀案例

## 视图名称

建议新增：

- `view=historical-missed-ops`

## 输出结构

### 1. summary

| 字段 | 说明 |
| --- | --- |
| `pendingReviews` | 当前待复核数量 |
| `completedReviews` | 当前已完成复核数量 |
| `backfillEligibleReviews` | 已完成复核中具备漏报回补条件的数量 |
| `historicalMissedTotal` | 漏报库当前总条数 |
| `verifiedHistoricalMissedTotal` | 漏报库中已人工确认条数 |

### 2. recentCompletedReviews

返回最近若干条已完成复核案例，辅助人工判断是否已具备沉淀价值。

建议字段：

- `reviewCaseId`
- `logErrorId`
- `finalErrorType`
- `updatedAt`
- `hasFinalCause`
- `hasResolution`
- `hasReviewNote`
- `hasAnalysisCause`
- `hasAnalysisSuggestion`
- `eligibleForBackfill`

### 3. recentHistoricalMissedCases

返回最近若干条已沉淀漏报案例，便于观察沉淀结果。

建议字段：

- `id`
- `title`
- `errorType`
- `sourceType`
- `updatedAt`
- `verified`
- `priority`

## 回补资格判定

`eligibleForBackfill = true` 的条件：

- `review_status = completed`
- 且至少满足以下之一：
  - `final_cause` 非空
  - `resolution` 非空
  - `review_note` 非空
  - 最近一条 `analysis_results.cause` 非空
  - 最近一条 `analysis_results.repair_suggestion` 非空

## 价值

这个视图不是为了展示“漏报库内容”，而是为了展示“漏报库运营状态”。

它的价值在于：

- 让漏报库建设从黑盒变成可观测
- 让回补动作有前后对照
- 让后续 UI 接入时有稳定后端接口

## 当前验收标准

1. 可以独立查询漏报库运营摘要
2. 可以看见 `pending / completed / eligible / historical_missed_total`
3. 可以看见最近已完成复核和最近沉淀漏报案例
4. 不要求当前必须已有大量数据
