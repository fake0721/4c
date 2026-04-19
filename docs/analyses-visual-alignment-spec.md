# 分析记录页面第二轮对齐规范

## 背景
- `/dashboard/high-risk` 已完成第一阶段脱 iframe。
- 当前 Next 版已具备真实数据与基础结构，但筛选区、表格状态标签、风险标签和分页层次与原 `public/inner-pages/分析记录/code.html` 仍有细节偏差。

## 本轮目标
1. 继续只处理分析记录页面。
2. 保持现有字段契约与数据来源不变。
3. 在不回退 iframe 的前提下，让视觉层次进一步贴近原静态页。

## 范围
- `components/dashboard/pages/analyses/analyses-page.tsx`
- `components/dashboard/pages/analyses/analyses-filters.tsx`
- `components/dashboard/pages/analyses/analyses-table.tsx`
- `app/globals.css`

## 实施要求
1. 筛选区继续使用米色玻璃面板，但输入区底色、边框、图标和标签颜色要更贴近原静态页。
2. 状态标签和风险标签沿用原静态页语义：
   - 已完成：绿色
   - 分析中：黄棕色
   - 已失败：红色
   - 高风险 / 中风险 / 低风险：对应半透明底色与边框
3. 表格与分页应形成同一块面板，不出现明显割裂。
4. 空态保持当前真实数据逻辑，只优化观感，不添加演示数据。

## 非目标
- 不修改 `lib/dashboard/analyses.ts` 字段结构。
- 不修改 `/api/inner-data`。
- 不推进 `account`、`tasks`、`rules`、`incidents` 页面迁移。
- 不删除 `StaticInnerPage` 或 `public/inner-pages`。

## 验收标准
1. `/dashboard/high-risk` 的筛选区、表格和分页层次更接近原静态页。
2. 状态标签和风险标签颜色语义清晰、稳定。
3. `eslint` 通过。
4. `npm run build` 通过。
