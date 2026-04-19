# 历史日志存档第一阶段迁移记录

## 本轮范围
- 将 `/dashboard/tasks` 从 `StaticInnerPage + iframe` 改为真实 Next 页面
- 保持现有“历史与知识”米色视觉层次
- 继续复用现有历史日志下载、删除动作

## 主要修改
1. 新增 `lib/dashboard/tasks.ts`
   - 复用 `view=history-logs` 口径
   - 产出历史日志表格数据、待复核数量和右侧概览数据

2. 新增 `components/dashboard/pages/tasks/tasks-page.tsx`
   - 覆盖标题区、切换条、筛选区、历史日志表格、分页和右侧概览
   - 客户端保留关键词/日期筛选、分页、下载、删除交互

3. 替换 `app/dashboard/tasks/page.tsx`
   - 不再走 `StaticInnerPage`
   - 改为直接渲染 `TasksPage`

4. 扩展 dashboard 公共壳
   - `dashboard-layout.tsx` 将 `/dashboard/tasks` 纳入已迁移页面集合
   - `dashboard-topbar.tsx` 新增“工作台·历史与知识 / 历史日志存档”标题映射

## 兼容性说明
- 未迁移“历史问题库”和“探索根因知识库”子页，仍保留旧入口链接
- 未修改 `/api/inner-data` 的 `history-download` 与 `history-delete` 契约
- 未删除 `StaticInnerPage` 与 `public/inner-pages` 兼容层
