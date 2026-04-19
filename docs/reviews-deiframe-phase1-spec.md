# 人工复核去 iframe 第一阶段规范

## 目标
- 在工作台试点完成后，启动下一页 `人工复核` 的第一刀实施。
- 将 `/dashboard/reviews` 从 `StaticInnerPage` 切换为真实 Next 页面。
- 保持现有 UI 样式语言、字段契约和真实数据来源不变。

## 本轮范围
1. `lib/dashboard/reviews.ts`
2. `app/dashboard/reviews/page.tsx`
3. `components/dashboard/pages/reviews/*`
4. `components/dashboard/shell/dashboard-layout.tsx`
5. `components/dashboard/shell/dashboard-topbar.tsx`
6. `智能日志分析系统任务清单.txt`

## 实施要求
1. 人工复核数据逻辑优先复用现有 `/api/inner-data?view=reviews` 与 `history-cases` 的查询口径。
2. 新页面直接走 `lib/dashboard/reviews.ts`，不再依赖 iframe 内脚本拼 DOM。
3. 公共壳继续只对已迁移页面生效。
4. 顶栏标题需按路由切换，避免工作台标题错误复用到人工复核。

## 本轮页面范围
1. 待复核队列
2. 问题详情区
3. 历史相似案例
4. 底部操作栏

## 验收标准
1. `/dashboard/reviews` 不再依赖 `StaticInnerPage`。
2. 页面外观保持现有米色工作台体系和人工复核页面层次。
3. review 队列与历史案例显示真实数据或空态。
4. `eslint` 和 `npm run build` 通过。
