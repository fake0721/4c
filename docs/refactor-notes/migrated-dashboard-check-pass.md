# 已迁 Dashboard 页面总检查补漏记录

## 变更目标
- 解决总检查中发现的两个公共壳问题：
  1. 侧栏高亮映射不完整。
  2. 顶栏在浅色壳层下仍沿用旧浅色文案与图标配色。

## 实际改动
1. `dashboard-sidebar.tsx`
   - 将已迁和相关路由按业务分组映射到正确侧栏入口。
   - 覆盖工作台、日志分析、问题处理、系统管理等分组。
2. `dashboard-topbar.tsx`
   - 将标题、分隔符、搜索图标、通知按钮、工具按钮等颜色统一为米色主题下的深色可读方案。

## 验证
- `npx eslint components/dashboard/shell/*.tsx`
- `npm run build`
