# 人工复核页问题修正记录

## 变更目标
- 修复人工复核页 3 个已确认问题：
  1. 确认并下一条只切换前端，不落库。
  2. 历史相似案例查看详情不生效。
  3. 底部操作栏在窄屏下错位。

## 实际改动
1. `app/api/inner-data/route.ts`
   - 新增最小 `complete-review` 动作。
   - 仅负责将指定 `review_case` 标记为 `completed` 并刷新 `updated_at`。
2. `components/dashboard/pages/reviews/reviews-page.tsx`
   - 将队列与历史案例改为页面内可更新状态。
   - `确认并下一条` 现在会先调用接口落库，再把当前项从待复核队列移入历史案例。
3. `components/dashboard/pages/reviews/review-history-cases.tsx`
   - 历史案例 `查看详情` 改为真实选择动作，不再是无效跳转。
4. `components/dashboard/pages/reviews/review-detail.tsx`
   - 历史项详情模式下隐藏确认按钮，改为只读提示。
   - 底部操作栏改为响应式布局，小屏不再写死 `left-64`。

## 验证
- `npx eslint app/dashboard/reviews/page.tsx components/dashboard/pages/reviews/*.tsx lib/dashboard/reviews.ts app/api/inner-data/route.ts`
- `npm run build`
