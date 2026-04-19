# 分析报告详情页第一阶段迁移规范

## 目标
- 将 `/dashboard/analyses` 从 `StaticInnerPage + iframe` 切换为真实 Next 页面
- 保持当前分析报告详情页的米色视觉层次、摘要卡片、分布区、根因区和问题明细结构
- 复用现有 `analysis-report` 数据口径，不修改返回字段契约

## 范围
1. `lib/dashboard/analysis-report.ts`
2. `components/dashboard/pages/analysis-report/*`
3. `app/dashboard/analyses/page.tsx`
4. `components/dashboard/shell/dashboard-layout.tsx`
5. `components/dashboard/shell/dashboard-topbar.tsx`
6. `智能日志分析系统任务清单.txt`

## 实施要求
1. 首屏数据由 `lib/dashboard/analysis-report.ts` 提供，字段与现有 `view=analysis-report` 保持一致。
2. 页面首轮覆盖：
   - 报告头部信息与操作按钮
   - 摘要卡片
   - 问题类型分布
   - 风险等级分布
   - 根因与建议区
   - 问题明细列表
3. 保留导出 Word / PDF 和“提交复核”按钮，允许第一阶段采用基础实现。
4. 不改规则层、模型层、RAG 层逻辑。

## 非目标
- 不修改 `/api/inner-data` 的 `analysis-report` 返回结构
- 不删除 `StaticInnerPage` 或 `public/inner-pages`
- 不迁移其它未完成 dashboard 页面

## 验收标准
1. `/dashboard/analyses` 不再依赖 iframe。
2. 页面可根据 `logId` 展示真实分析报告数据。
3. 主要视觉区块保持当前米色报告页风格。
4. `eslint` 和 `npm run build` 通过。
