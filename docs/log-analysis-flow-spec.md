# 日志上传与分析详情页对齐规范

## 目标

- 上传文件后，必须进入真实分析链路，而不是跳转到静态占位页。
- 分析完成后，必须进入当前日志对应的真实详情页。
- 继续复用现有 `createLogUploadAction`、`logs`、`log_errors`、`analysis_results` 与 `LogDetail` 组件。

## 当前问题

- `app/upload/page.tsx` 仅维护前端本地文件状态，点击开始分析后直接 `router.push('/dashboard')`。
- `app/dashboard/logs/[logId]/page.tsx` 仍然返回静态 iframe 页面，未读取真实日志数据。
- `createLogUploadAction` 已经具备真实上传、规则检测、分析结果写库和成功后跳转到 `/dashboard/logs/:id` 的能力，但上传页未接入。

## 方案

### 上传页

- 改为使用 `<form action={createLogUploadAction}>`。
- 保留现有页面视觉结构，不大改布局。
- 文件输入字段名必须保持为 `logFile`，以兼容现有 server action。
- 增加 `sourceType` 选择，默认值使用 `custom`。
- 使用现有 `SubmitButton` 处理提交中的按钮状态。

### 详情页

- `app/dashboard/logs/[logId]/page.tsx` 改为真实服务端页面。
- 从 `logs` 表读取当前用户自己的日志主记录。
- 从 `log_errors`、`analysis_results` 读取关联数据。
- 从 Storage 下载日志文本，构造最多前 40 行的预览。
- 将结果映射后传给现有 `components/dashboard/log-detail.tsx`。

## 兼容约束

- 不修改规则引擎、模型分析和 RAG 调用逻辑。
- 不新增新的分析写库流程。
- 不调整已有数据表字段定义。
- 上传完成后的成功跳转仍保持 `/dashboard/logs/:id`。

## 验证标准

- 上传页面可以直接提交真实文件。
- 成功后跳转到对应日志详情页。
- 详情页展示日志基本信息、异常命中、分析结果和日志预览。
- 构建通过。
