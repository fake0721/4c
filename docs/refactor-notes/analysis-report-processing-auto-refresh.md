# 分析报告 processing 自动刷新

## 背景
在日志分析耗时较长时，用户进入报告页可能看到旧状态，误认为流程卡住。

## 改动

### 1. 数据层补充原始状态字段
文件：`lib/dashboard/analysis-report.ts`

- 在 `AnalysisReportData.log` 中新增 `status` 字段。
- 将日志记录的原始 `status`（如 `processing`、`completed`、`failed`）透传到前端。

### 2. 报告页增加自动轮询
文件：`components/dashboard/pages/analysis-report/analysis-report-page.tsx`

- 当 `status === "processing"` 时，每 3 秒触发一次 `router.refresh()`。
- 页面顶部增加“分析中自动刷新”的提示文案。
- 当状态变为非 processing 时自动停止轮询。

## 兼容性
- 未修改数据库结构。
- 未修改上传分析主流程与接口字段。

## 验证建议
1. 上传一份耗时较长日志。
2. 进入报告页后确认出现“分析中”提示。
3. 等待分析完成，确认页面自动刷新为最新结果。
