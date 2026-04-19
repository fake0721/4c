# 历史漏报库首批待复核完成与回补方案

## 目标
- 先把一批具备充分分析依据的 `pending review` 更新为 `completed`
- 再触发一次历史漏报回补
- 验证 `historical_missed_cases` 是否开始增长

## 批次范围
- 批次名称：`historical_missed_cases_completion_batch_1`
- 批次规模：15 条

## 选择条件
1. `review_cases.review_status = pending`
2. 存在最新一条 `analysis_results`
3. 最新分析中 `cause` 与 `repair_suggestion` 均非空
4. 风险为高风险，或复核原因中包含 `high_risk`
5. 排除“当前无法确定”“通常需要结合更多上下文”等明显占位型结论

## 落库策略
- 将 `review_status` 更新为 `completed`
- 用最新分析结果补齐：
  - `final_error_type`
  - `final_cause`
  - `resolution`
  - `final_risk_level`
- 在 `review_note` 中保留原始原因，并追加批次标记，避免和真实人工逐条完成混淆

## 回补策略
- 仅对本批已完成记录执行漏报回补
- 漏报案例需保留：
  - `title`
  - `error_type`
  - `source_type`
  - `log_excerpt`
  - `root_cause`
  - `solution`
  - `verified`
  - `updated_at`
  - `priority`

## 验证口径
- `review_cases.completed` 数量增长
- `historical_missed_cases` 数量增长
- 历史问题页摘要中的：
  - 已复核
  - 可回补
  - 漏报库条目
  应出现对应变化
