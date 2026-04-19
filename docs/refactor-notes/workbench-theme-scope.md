# 工作台米色主题作用域收口记录

## 本次调整

- 给 `/dashboard` 新壳增加 `dashboard-mocha-surface` 作用域。
- 在全局样式中仅对该作用域下的工作台面板收口：
  - `glass-panel`
  - `glass-card`
  - `text-white`
  - `text-white/30`
  - `text-white/40`
  - `text-white/60`
- 保持工作台继续使用单一路由渲染，不回退 iframe。

## 涉及文件

- `智能日志分析系统任务清单.txt`
- `docs/workbench-theme-scope-spec.md`
- `app/globals.css`
- `components/dashboard/shell/dashboard-layout.tsx`
- `components/dashboard/pages/workbench/workbench-page.tsx`

## 结果

- 工作台米色主题下的文字层级更接近原静态页。
- 主题收口限制在工作台新壳作用域内，没有扩散为全局重构。
- `eslint` 与 `build` 均通过。
