# UI Finish Pass

## 变更范围
- `components/dashboard/shell/dashboard-sidebar.tsx`
- `components/dashboard/pages/upload/upload-page.tsx`
- `components/dashboard/pages/reviews/review-detail.tsx`
- `components/dashboard/pages/analysis-report/analysis-report-page.tsx`

## 本轮调整
1. 左侧菜单“日志分析”入口改为进入 `/dashboard/high-risk`，同时保留 `/upload` 由“开始新分析”进入。
2. 上传页移除可见的“日志来源”下拉框，改为隐藏字段 `sourceType=custom`，保持后端提交契约不变。
3. 人工复核详情页移除“下载完整日志”按钮，仅保留日志片段展示区。
4. 分析报告页恢复风险等级分布圆环图的高/中/低风险配色显示。

## 兼容性说明
- 未修改任何接口返回结构。
- 未修改上传动作字段名、人工复核数据结构或分析报告数据 helper。
- 侧栏信息架构调整不影响“开始新分析”的上传入口。

## 验证
- `npx eslint components/dashboard/shell/dashboard-sidebar.tsx components/dashboard/pages/upload/upload-page.tsx components/dashboard/pages/reviews/review-detail.tsx components/dashboard/pages/analysis-report/analysis-report-page.tsx`
- `npm run build`
