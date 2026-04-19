# 人工复核第二轮对齐规范

## 目标
- 继续仅处理 `/dashboard/reviews`。
- 在首轮去 iframe 已完成的基础上，对齐左右栏层次、选中态和底部操作栏交互。
- 不进入分析记录页，不改数据字段契约。

## 本轮范围
1. `components/dashboard/pages/reviews/reviews-page.tsx`
2. `components/dashboard/pages/reviews/review-queue.tsx`
3. `components/dashboard/pages/reviews/review-detail.tsx`
4. `智能日志分析系统任务清单.txt`

## 实施要求
1. review 队列和详情区继续保持现有真实数据来源。
2. “确认并下一条”改为客户端切换当前选中任务，不引入额外接口。
3. 继续保持米色工作台体系，不回退到旧 iframe 页面。

## 验收标准
1. 左右栏和底部操作栏更接近原静态人工复核页。
2. 选中态、进度文案、下一条切换交互正常。
3. `eslint` 和 `npm run build` 通过。
