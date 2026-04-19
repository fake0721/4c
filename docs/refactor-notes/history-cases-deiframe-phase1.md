# 历史问题库第一阶段记录

## 本轮变更
1. 新增 `lib/dashboard/history-cases.ts`，复用现有历史复核记录口径，提供问题库首屏数据。
2. 新增 `app/dashboard/history-cases/page.tsx` 与 `components/dashboard/pages/history-cases/history-cases-page.tsx`，将历史问题库改为真实 Next 页面。
3. 更新 `DashboardLayout`、`DashboardTopbar`、`DashboardSidebar` 的路由映射，使历史问题库页落入“历史与知识”分组。
4. 将历史日志页与规则页内原先指向 `/inner-pages/历史问题库/code.html` 的入口改为 `/dashboard/history-cases`。

## 保留项
1. `public/inner-pages/历史问题库/code.html` 暂时保留为迁移对照。
2. “探索根因知识库” 仍保持旧静态入口，后续单独迁移。
3. `view=history-cases` 的接口口径未改。
