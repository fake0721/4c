# Sidebar Upload Entry Correction

## 变更范围
- `components/dashboard/shell/dashboard-sidebar.tsx`

## 本轮调整
1. 左侧菜单“日志分析”恢复指向 `/upload`。
2. 保留上传页、分析记录页、分析报告详情页在同一菜单分组下的高亮归属。
3. 侧栏底部主按钮改为“进入分析记录”，点击跳转到 `/dashboard/high-risk`。

## 兼容性说明
- 未修改上传页表单字段。
- 未修改页面数据结构与接口契约。
- 未改动其它页面布局和菜单分组。

## 验证
- `npx eslint components/dashboard/shell/dashboard-sidebar.tsx`
- `npm run build`
