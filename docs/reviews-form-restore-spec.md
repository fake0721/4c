# Reviews Form Restore Spec

## 背景
- 当前 Next 版人工复核页只补回了“复核说明 / 处置方案”输入区。
- 原静态页实际包含完整的“人工复核确认表单”：
  - 人工判定原因
  - 风险确认级别
  - 复核说明 / 处置方案
- 现有数据库 `review_cases` 已具备 `final_error_type`、`final_risk_level`、`review_note` 字段，可直接复用。

## 目标
1. 在人工复核页恢复完整表单结构，视觉与旧页语义一致。
2. “确认并下一条”时一并写入人工判定原因、风险确认级别和复核说明。
3. 历史案例详情展示已保存内容，保持只读。

## 实施范围
- `lib/dashboard/reviews.ts`
- `components/dashboard/pages/reviews/reviews-page.tsx`
- `components/dashboard/pages/reviews/review-detail.tsx`
- `app/api/inner-data/route.ts`

## 字段约束
- `final_error_type`
  - 继续使用现有问题类型值，不新增新字段。
- `final_risk_level`
  - 继续使用 `high | medium | low`。
- `review_note`
  - 使用用户填写的复核说明 / 处置方案文本。

## 不做项
- 不改人工复核队列查询逻辑。
- 不新增数据库迁移。
- 不改历史相似案例数据来源。

## 验收标准
1. 人工复核页出现完整的“人工复核确认表单”。
2. 确认动作完成后，`review_cases` 中对应三项字段被更新。
3. 历史案例展示保存后的值，且表单禁用。
4. `eslint` 与 `npm run build` 通过。
