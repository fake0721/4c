# 性能分析第一阶段记录

## 本轮变更
1. 新增 `lib/dashboard/performance.ts`，复用现有 performance 聚合口径，提供默认 7 天和自定义范围的服务端首屏数据。
2. 新增 `app/dashboard/performance/page.tsx` 与 `components/dashboard/pages/performance/performance-page.tsx`，将性能分析页改为真实 Next 页面。
3. 更新 `DashboardLayout`、`DashboardTopbar`、`DashboardSidebar` 的路由映射，使性能分析页落入系统管理分组。
4. 将规则页、系统设置页内原先指向 `/inner-pages/性能分析/code.html` 的入口改为 `/dashboard/performance`。

## 保留项
1. `public/inner-pages/性能分析/code.html` 暂时保留为迁移对照。
2. `view=performance` 的接口口径未改，客户端切换范围仍复用该接口。
3. 知识库两页与独立静态入口页未在本轮处理。
