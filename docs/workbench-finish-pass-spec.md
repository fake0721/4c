# 工作台试点收尾规范

## 目标
- 继续仅处理 `/dashboard` 工作台试点。
- 收紧顶栏、列表区和待办区的视觉细节，使其进一步贴近原 `public/inner-pages/工作台/code.html`。
- 不扩散到其它 dashboard 页面。

## 本轮范围
1. `components/dashboard/shell/dashboard-topbar.tsx`
2. `components/dashboard/pages/workbench/workbench-page.tsx`
3. `components/dashboard/pages/workbench/workbench-recent-list.tsx`
4. `components/dashboard/pages/workbench/workbench-pending-todos.tsx`
5. `智能日志分析系统任务清单.txt`

## 实施要求
1. 顶栏继续保留当前 Next 组件结构，不回退到静态页脚本式实现。
2. 列表区和待办区只收视觉和 hover 细节，不改跳转和数据来源。
3. 保持 `/dashboard` 单一路由渲染，不重新引入 iframe。

## 验收标准
1. 工作台顶栏、最近分析结果、待处理事项更接近原静态页的米色玻璃风格。
2. 现有跳转和交互不回退。
3. `eslint` 和 `npm run build` 通过。
