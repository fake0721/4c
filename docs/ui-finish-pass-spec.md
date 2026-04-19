# UI Finish Pass Spec

## 背景
- 当前统一 Next 页面主流程已经打通，但仍有少量 UI 细节与预期不一致。
- 这些问题集中在侧栏入口、上传页表单、人工复核详情区和分析报告图表表现，不涉及数据结构改动。

## 目标
1. 让左侧菜单“日志分析”更符合当前信息架构，直接进入分析记录。
2. 精简上传页，只保留必要字段显示，但继续兼容后端动作契约。
3. 移除人工复核页无效或不需要的“下载完整日志”按钮。
4. 恢复分析报告风险占比图的颜色显示，增强可读性。

## 实施范围
- `components/dashboard/shell/dashboard-sidebar.tsx`
- `components/dashboard/pages/upload/upload-page.tsx`
- `components/dashboard/pages/reviews/review-detail.tsx`
- `components/dashboard/pages/analysis-report/analysis-report-page.tsx`

## 不做项
- 不修改任何 API 返回结构。
- 不调整上传动作字段名与分析链路。
- 不修改其它页面的布局结构。

## 验收标准
1. 侧栏“日志分析”跳转到 `/dashboard/high-risk`。
2. 上传页不再显示“日志来源”下拉框，但表单仍提交 `sourceType`。
3. 人工复核页不再显示“下载完整日志”按钮。
4. 分析报告风险分布图有清晰的高/中/低风险颜色。
5. `eslint` 与 `npm run build` 通过。
