# 静态上传页接入真实分析链路规范

## 背景

- 工作台当前仍大量使用 `public/inner-pages/*` 静态 iframe 页面。
- 用户实际触发上传分析时，走的是 `public/inner-pages/日志上传/code.html`，不是 `/upload`。
- 该静态页目前只做前端假进度，随后直接跳转到 `../分析报告/code.html`，导致仍然进入静态报告模板。

## 目标

- 保留现有静态上传页外观与交互结构。
- 让静态上传页复用现有真实上传分析逻辑。
- 上传成功后，顶层页面直接跳转到 `/dashboard/logs/:id` 真实详情页。

## 方案

### 后端

- 抽取 `createLogUploadAction` 的核心上传分析逻辑为共享服务。
- 新增一个可供静态页 `fetch` 调用的上传接口。
- server action 与新接口都调用同一份共享服务，避免双份逻辑漂移。

### 前端静态页

- `public/inner-pages/日志上传/code.html` 改为维护真实已选文件列表。
- 点击“开始分析”时，以 `FormData` 上传首个已选文件到新接口。
- 成功后使用 `window.top.location.href = /dashboard/logs/:id` 跳出 iframe，进入真实详情页。

## 兼容约束

- 不改规则引擎、模型分析、RAG 链路。
- 不改分析结果表结构。
- 不重做整套 dashboard，只桥接静态上传入口。
