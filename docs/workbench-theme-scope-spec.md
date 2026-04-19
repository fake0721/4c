# 工作台米色主题作用域收口规范

## 背景

- `/dashboard` 已经脱 iframe，并且外层容器已对齐到接近原 `StaticInnerPage` 的结构。
- 但当前 React 页面仍沿用部分通用类名，如 `glass-panel`、`text-white`、`text-white/40`。
- 原静态工作台依赖页面内的局部覆盖样式，将这些类映射成米色主题下的深色文字与浅色面板。
- 新实现若不补齐这层作用域，会导致工作台出现过白、过亮或层级不一致的问题。

## 目标

- 只在工作台新壳作用域内恢复原静态页的米色主题表现。
- 不污染登录页、上传页和其它未迁移页面。
- 不回退到页面内联大块样式。

## 范围

- `app/globals.css`
- `components/dashboard/shell/dashboard-layout.tsx`

## 实施要求

1. 为新工作台壳增加独立主题作用域类名。
2. 在该作用域下收口：
   - `glass-panel`
   - `glass-card`
   - `text-white`
   - `text-white/30`
   - `text-white/40`
   - `text-white/60`
3. 保持顶栏、侧栏与通知弹层的米色主题一致。
4. 只修改工作台当前用到的主题表现，不扩散为全站重构。

## 验收标准

- 工作台卡片和图表区的文字层级接近原静态页。
- 顶栏与内容区在米色主题下不出现明显“白字漂浮”问题。
- `npm run build` 通过。
