# 静态上传页接真实分析链路改造记录

## 问题来源

- 用户在工作台实际点击的是静态 iframe 上传页 `public/inner-pages/日志上传/code.html`
- 该页面原先只做前端假动画，随后直接跳到 `../分析报告/code.html`
- 因此即使 `/upload` 和 `/dashboard/logs/[logId]` 已接好，用户仍会进入静态报告页

## 本次改动

### 1. 抽取共享上传分析服务

- 文件：`lib/logs/upload-service.ts`
- 将日志上传、入库、规则检测、分析结果写入、复核记录生成抽成共享方法
- 供 server action 与 API route 共同复用

### 2. 保留原 server action 入口

- 文件：`app/logs/actions.ts`
- `createLogUploadAction` 改为调用共享服务
- 现有 `/upload` 页面继续可用

### 3. 新增静态页可调用的上传接口

- 文件：`app/api/logs/upload/route.ts`
- 允许静态 iframe 页面通过 `fetch + FormData` 调用真实分析后端
- 成功后返回真实 `logId` 和 `redirectTo`

### 4. 修正静态上传页跳转

- 文件：`public/inner-pages/日志上传/code.html`
- 维护真实已选文件数组
- 点击“开始分析”时上传首个已选文件到 `/api/logs/upload`
- 成功后使用 `window.top.location.href` 跳转到 `/dashboard/logs/:id`

## 结果

- 用户从工作台静态上传入口发起分析时，不再进入静态报告模板
- 上传完成后会进入真实日志详情页
- `npm run build` 已通过
