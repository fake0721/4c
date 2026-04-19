# 分析记录页面第二轮对齐记录

## 变更目标
- 对已脱 iframe 的分析记录页做第二轮视觉对齐。
- 不改数据契约，只收口筛选区、表格状态/风险标签和分页层次。

## 实际改动
1. 调整 `AnalysesFilters`
   - 收紧面板、输入框、标签和图标的颜色层次。
   - 为下拉框补上统一箭头和更接近原静态页的浅米色输入底。
2. 调整 `AnalysesTable`
   - 统一表头底色、行 hover、空态样式。
   - 状态与风险标签继续复用原静态页语义颜色。
3. 调整 `AnalysesPage`
   - 让表格和分页并入同一块面板。
   - 微调标题区和统计辅助信息。
4. 补充 `app/globals.css`
   - 为分析记录页补齐 `status-*` 与 `risk-*` 样式，保持与原静态页一致。

## 验证
- `npx eslint app/dashboard/high-risk/page.tsx components/dashboard/pages/analyses/*.tsx lib/dashboard/analyses.ts`
- `npm run build`
