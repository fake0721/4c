# 工作台外层壳对齐记录

## 本次调整

- 将 `/dashboard` 的新壳从整页铺开改为容器式承载结构。
- 外层恢复为接近原 `StaticInnerPage` 的：
  - 米色页面背景
  - 白色圆角容器
  - 细边框
  - 阴影包裹
- 将工作台侧栏与顶栏的定位由全局 `fixed` 改为相对容器的 `absolute`。

## 涉及文件

- `components/dashboard/shell/dashboard-layout.tsx`
- `components/dashboard/shell/dashboard-sidebar.tsx`
- `components/dashboard/shell/dashboard-topbar.tsx`

## 结果

- `/dashboard` 的视觉包裹感更接近原静态嵌入页。
- 工作台仍然保持单一 Next 渲染流程，没有回退到 iframe。
- 未迁移的 dashboard 子页仍然保留旧兼容行为。
