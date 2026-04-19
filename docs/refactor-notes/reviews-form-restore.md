# Reviews Form Restore

## 本轮目标
- 恢复人工复核页原静态版中的完整“人工复核确认表单”。
- 将人工判定原因、风险确认级别、复核说明接入现有 `review_cases` 字段保存。

## 实施内容
1. 扩展 `lib/dashboard/reviews.ts`
   - 为 `ReviewItem` 增加 `issueTypeValue`、`riskValue`、`reviewNote`。
   - 从 `review_cases` 读取 `review_note`，并将问题类型与风险原始值一并带到前端。
2. 调整 `components/dashboard/pages/reviews/reviews-page.tsx`
   - 将表单状态扩展为完整三项。
   - “确认并下一条”提交 `finalErrorType`、`finalRiskLevel`、`reviewNote`。
   - 本地完成后同步更新历史案例显示值。
3. 调整 `components/dashboard/pages/reviews/review-detail.tsx`
   - 恢复“人工复核确认表单”标题。
   - 补回“人工判定原因”“风险确认级别”两个下拉。
   - 保留并接通“复核说明 / 处置方案”输入区。
   - 历史案例详情保持只读。
4. 扩展 `app/api/inner-data/route.ts`
   - `complete-review` 在保持旧调用兼容的前提下，支持写入：
     - `final_error_type`
     - `final_risk_level`
     - `review_note`

## 结果
- 人工复核页现在不再是单独前端临时 textarea。
- 三项复核内容都已进入真实落库流程。
- 历史案例页签会显示已保存的风险和说明。

## 校验
- `npx eslint lib/dashboard/reviews.ts components/dashboard/pages/reviews/reviews-page.tsx components/dashboard/pages/reviews/review-detail.tsx app/api/inner-data/route.ts`
  - 通过，仅保留 `route.ts` 里两个历史 warning。
- `npm run build`
  - 通过。
