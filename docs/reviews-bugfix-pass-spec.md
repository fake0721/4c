# 人工复核页问题修正规范

## 背景
- `/dashboard/reviews` 已脱离 iframe，但当前实现存在行为级问题。
- 已确认的问题包括：
  1. `确认并下一条` 仅切换本地选中项，没有真实落库。
  2. 历史相似案例的 `查看详情` 跳转无法驱动页面切换。
  3. 底部操作栏在窄屏下因固定 `left-64` 产生错位。

## 目标
1. 只修复人工复核页当前这 3 个问题。
2. 不改变现有 review 数据字段契约。
3. 不扩散到其他页面迁移。

## 范围
- `app/api/inner-data/route.ts`
- `components/dashboard/pages/reviews/reviews-page.tsx`
- `components/dashboard/pages/reviews/review-detail.tsx`
- `components/dashboard/pages/reviews/review-history-cases.tsx`

## 实施要求
1. 为 review 页补一个最小更新动作，仅负责将当前 `review_case` 标记为已完成并更新时间。
2. 历史案例详情必须可读，允许通过查询参数或本地状态进入历史项详情。
3. 历史项详情不应显示“确认并下一条”的处理按钮。
4. 底部操作栏必须兼容小屏，不再写死桌面侧栏偏移。

## 非目标
- 不改 review 数据结构。
- 不接入新的复杂人工复核表单流。
- 不处理下一页迁移。

## 验收标准
1. `确认并下一条` 会真实更新复核状态。
2. 历史相似案例 `查看详情` 可正常进入详情视图。
3. 窄屏下底部操作栏不再错位。
4. `eslint` 通过。
5. `npm run build` 通过。
