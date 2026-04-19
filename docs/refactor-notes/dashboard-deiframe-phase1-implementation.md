# Dashboard 去 iframe 第一阶段实施记录

## 本次范围

- 新增 `app/dashboard/layout.tsx`
- 新增 `components/dashboard/shell/*`
- 新增 `components/dashboard/pages/workbench/*`
- 新增 `lib/dashboard/workbench.ts`
- 将 `app/dashboard/page.tsx` 从 `StaticInnerPage` 改为直接渲染 React 工作台页面

## 已完成内容

- dashboard 路由树新增真实 layout，但只对已迁移的 `/dashboard` 启用新壳。
- 未迁移的 `reviews`、`high-risk`、`tasks`、`rules`、`account`、`incidents` 仍保持原 iframe 兼容方式。
- 工作台页面已不再依赖 `public/inner-pages/工作台/code.html`。
- 工作台数据已从 `/api/inner-data?view=dashboard` 对应逻辑抽出到 `lib/dashboard/workbench.ts`。

## 兼容策略

- `app/dashboard/layout.tsx` 使用按路径启用新壳的方式，避免未迁移页面出现双壳。
- 现有 `StaticInnerPage` 未删除，继续承担兼容职责。

## 风险说明

- 当前工作台已脱 iframe，但其它 dashboard 页面仍然保留旧链路。
- 现有深色版 `components/dashboard/*.tsx` 组件未参与本次迁移，避免破坏当前米色静态 UI 风格。
