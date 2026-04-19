# ReviewDecision 下沉说明

## 本轮目标

- 将 `ReviewDecision` 统一收口到 `lib/analysis/orchestrator.ts`
- 让上传链路基于统一决策写入 `review_cases`
- 移除 `app/dashboard/reviews/page.tsx` 里的本地复核判定函数
- 保持现有页面与提交流程可用

## 实际修改文件

- `lib/analysis/orchestrator.ts`
- `app/logs/actions.ts`
- `app/dashboard/reviews/page.tsx`
- `docs/review-refactor-notes.md`

## 新增的统一接口与能力

本轮在 orchestrator 中新增：

- `ReviewDecision`
- `ReviewDecisionReasonCode`
- `buildReviewDecision()`
- `buildReviewDecisions()`

当前 `ReviewDecision` 会统一产出：

- `incidentId`
- `needsReview`
- `reviewStatus`
- `reviewReasonCodes`
- `reviewNote`
- `finalErrorType`
- `finalRiskLevel`

## 判定规则

当前统一规则如下：

- `existing_review`：已有 review 记录
- `explicit_uncertain`：规则侧显式不确定
- `missing_analysis`：没有分析结果
- `rule_only_result`：结果来自 rule fallback
- `high_risk`：风险等级为 `high`
- `low_confidence`：`confidence < 0.72`
- `dual_check_diverged`：双检抽样时 rule/llm 结果出现显著分歧

只要存在原因码，就会进入 `needsReview = true`。

## 上传链路变化

`app/logs/actions.ts` 现在会：

1. 先由 orchestrator 生成代表样本分析结果
2. 再由 orchestrator 生成结构化 `ReviewDecision`
3. 将需要复核的决策映射为 `review_cases` 行
4. 再叠加 dual-check 的额外复核记录
5. 合并去重后统一写入 `review_cases`

这意味着新上传的数据，不再依赖 reviews 页面临时计算是否需要人工复核。

## Reviews 页面变化

`app/dashboard/reviews/page.tsx` 不再自带 `needsHumanReview()`。

现在页面会：

- 优先读取已有 `review_cases`
- 对旧数据或缺失 review 记录的数据，复用 orchestrator 的 `buildReviewDecision()` 做兼容判定

这样 UI 不再拥有独立的业务判定版本。

## 兼容性说明

- `app/reviews/actions.ts` 无需修改，现有提交流程仍可用
- 旧数据即使没有 `review_cases`，页面仍能通过统一判定函数显示
- 新数据上传后会更早写入 `review_cases`
- dual-check 逻辑仍保留，只是原因码与备注被纳入统一决策链

## 验证情况

- 已运行 `npx tsc --noEmit`
- 类型检查通过

## 下一步建议

下一轮应继续做两件事：

1. 让 `analysis_results` 显式持久化 `needsReview` / `providerUsed` / `confidenceLevel`
2. 再把 reviews 页面和 log detail 页面改成只消费统一 ViewModel，而不是直接拼数据库字段
