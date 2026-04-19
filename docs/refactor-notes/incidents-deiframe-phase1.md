# 问题处理第一阶段迁移记录

## 本轮范围
- 将 `/dashboard/incidents` 从 `StaticInnerPage + iframe` 改为真实 Next 页面
- 保持当前“问题中心”米色视觉、筛选条、表格和右侧洞察区结构
- 继续复用现有问题列表、系统处理建议趋势和今日复核效率口径

## 主要修改
1. 新增 `lib/dashboard/incidents.ts`
   - 复用 `view=incidents` 的字段口径
   - 产出问题列表、建议趋势和今日复核效率数据

2. 新增 `components/dashboard/pages/incidents/incidents-page.tsx`
   - 覆盖标题区、筛选区、问题表格、分页、系统处理建议趋势和今日复核效率卡片
   - 保留前往人工复核入口

3. 替换 `app/dashboard/incidents/page.tsx`
   - 不再走 `StaticInnerPage`
   - 改为直接渲染 `IncidentsPage`

4. 扩展 dashboard 公共壳
   - `dashboard-layout.tsx` 将 `/dashboard/incidents` 纳入已迁移页面集合
   - `dashboard-topbar.tsx` 新增“工作台·问题处理 / 问题中心”标题映射

## 兼容性说明
- 未新增问题详情子页
- “详情”与“立即处理”仍继续落到人工复核页
- 未修改 `/api/inner-data` 的 incidents 字段契约
- 未删除 `StaticInnerPage` 与 `public/inner-pages` 兼容层
