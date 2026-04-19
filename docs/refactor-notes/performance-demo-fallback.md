# 性能分析演示回退修复记录

## 本轮变更
1. 新增 `docs/performance-demo-fallback-spec.md`，定义性能页在真实样本不足时回退演示数据的规则与 UI 标识要求。
2. 更新 `lib/dashboard/performance.ts`，在 Supabase 未配置、用户未登录、或当前窗口无法形成有效三模式对比时，返回兼容字段结构的演示数据，而不是全 0 空结构。
3. 为 `PerformancePageData` 新增 `dataSource` 兼容字段，区分 `real` 与 `demo` 两种来源，并在性能页顶部与导出内容中展示来源说明。
4. 更新 `components/dashboard/pages/performance/performance-page.tsx`，把页面文案从“固定真实窗口”调整为“窗口聚合数据，样本不足自动回退演示数据”。
5. 更新 `app/api/inner-data/route.ts`，让 `view=performance` 直接复用 `getPerformancePageData`，消除首屏与时间切换使用两套逻辑的问题。

## 结果
1. 系统管理里的性能分析页不再出现全空对比图、全 0 指标和空明细表。
2. 没有真实数据时，页面会展示可读的演示对比，并明确标记为“演示数据回退”。
3. 有真实数据且能形成有效对比时，页面仍优先显示真实窗口聚合结果。

## 验证
1. `npm run build` 通过。
