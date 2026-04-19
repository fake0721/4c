# 分析记录去 iframe 第一阶段规范

## 目标
- 启动 `/dashboard/high-risk` 的去 iframe 迁移。
- 将当前静态 `分析记录` 页面集成到 Next 页面中。
- 保持现有样式语言、字段契约和筛选/表格结构不变。

## 本轮范围
1. `lib/dashboard/analyses.ts`
2. `app/dashboard/high-risk/page.tsx`
3. `components/dashboard/pages/analyses/*`
4. `components/dashboard/shell/dashboard-layout.tsx`
5. `components/dashboard/shell/dashboard-topbar.tsx`
6. `智能日志分析系统任务清单.txt`

## 实施要求
1. 优先复用现有 `/api/inner-data?view=analyses` 的查询口径。
2. 新页面直接走 `lib/dashboard/analyses.ts`，不再依赖 iframe 内脚本。
3. 筛选逻辑允许首轮做客户端筛选，不新增额外接口。
4. 公共壳继续只对已迁移页面生效。

## 本轮页面范围
1. 页面标题
2. 筛选区
3. 表格区
4. 分页区

## 验收标准
1. `/dashboard/high-risk` 不再依赖 `StaticInnerPage`。
2. 分析记录页面外观保持现有米色仪表盘体系。
3. 筛选、表格、分页在 Next 页面内运行。
4. `eslint` 和 `npm run build` 通过。
