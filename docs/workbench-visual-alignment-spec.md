# 工作台视觉与交互对齐规范

## 目标
- 继续仅处理 `/dashboard` 工作台试点页。
- 在不改变现有 UI 样式语言的前提下，让 Next 版工作台更接近原 `public/inner-pages/工作台/code.html`。
- 不扩散到人工复核、分析记录、个人页面等其它模块。

## 本轮范围
1. `components/dashboard/shell/dashboard-layout.tsx`
2. `components/dashboard/shell/dashboard-sidebar.tsx`
3. `components/dashboard/shell/dashboard-topbar.tsx`
4. `components/dashboard/pages/workbench/*`
5. `智能日志分析系统任务清单.txt`

## 实施要求
1. 公共壳继续只作用于 `/dashboard`，不能影响未迁移 iframe 页面。
2. 顶部通知弹层补齐“点击外部关闭”交互，行为向原静态页对齐。
3. 工作台卡片、图表、列表区继续保持米色主题，不回退到旧深色控制台风格。
4. 只做视觉和交互细化，不改 `lib/dashboard/workbench.ts` 的字段结构。

## 验收标准
1. `/dashboard` 的容器、顶部栏、侧边栏、卡片和列表层次更贴近原静态页。
2. 通知弹层可打开、可点击外部关闭，且不影响头像菜单。
3. `eslint` 和 `npm run build` 通过。
