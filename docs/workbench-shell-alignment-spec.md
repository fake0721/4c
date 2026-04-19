# 工作台脱 iframe 后外层壳对齐规范

## 背景

- 当前 `/dashboard` 已经脱离 iframe，改为直接由 Next 渲染。
- 但新壳目前仍是整页铺开，外层视觉与原 `StaticInnerPage` 的白色圆角承载容器不一致。
- 原静态方案虽然体验较差，但其外层边距、圆角、阴影形成了用户已习惯的视觉包裹感。

## 目标

- 保持工作台继续使用单一 Next 渲染流程。
- 让 `/dashboard` 外层结构更接近原 `StaticInnerPage` 的嵌入式视觉容器。
- 不把新壳错误施加到未迁移的 dashboard 页面。

## 范围

- `components/dashboard/shell/dashboard-layout.tsx`
- `components/dashboard/shell/dashboard-sidebar.tsx`
- `components/dashboard/shell/dashboard-topbar.tsx`

## 实施要求

1. `/dashboard` 使用米色背景 + 白色圆角容器 + 边框阴影。
2. 侧栏与顶栏相对容器定位，不再假设整页全屏布局。
3. 主内容区保留当前工作台 React 页面，不回退到 iframe。
4. 未迁移路由仍然直接渲染原兼容内容，不进入新容器。

## 验收标准

- `/dashboard` 视觉包裹感接近原静态嵌入页。
- 侧栏、顶栏、内容区边界关系自然，不出现错位。
- `npm run build` 通过。
