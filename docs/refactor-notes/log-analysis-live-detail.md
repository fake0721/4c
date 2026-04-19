# 日志上传与实时详情页改造记录

## 改动背景

- 用户从 `/upload` 上传日志后，没有进入真实分析详情，而是落到静态占位报告页。
- 现有后端 `createLogUploadAction` 已经能完成真实上传、检测、分析和结果写库，但前端上传页没有接入。

## 本次改动

### 1. 上传页接入真实 server action

- 文件：`app/upload/page.tsx`
- 将原本的前端本地跳转逻辑改为 `<form action={createLogUploadAction}>`
- 保留原页面结构，只调整为真实提交
- 文件字段名保持 `logFile`
- 新增 `sourceType` 选择，兼容现有上传动作

### 2. 日志详情页改为真实动态页

- 文件：`app/dashboard/logs/[logId]/page.tsx`
- 不再加载静态 iframe 页面
- 从 `logs`、`log_errors`、`analysis_results` 读取当前日志真实数据
- 从 Storage 读取日志文件并生成前 40 行预览
- 复用已有 `components/dashboard/log-detail.tsx`

## 保持不变的部分

- 规则检测逻辑未改
- 模型分析逻辑未改
- RAG 逻辑未改
- 数据表结构未改
- 上传成功后的跳转路径仍为 `/dashboard/logs/:id`

## 验证

- `npm run build` 通过
- `/dashboard/logs/[logId]` 已从静态路由变为动态服务端详情页
