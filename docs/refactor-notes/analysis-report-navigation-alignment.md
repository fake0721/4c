# 分析报告导航链路对齐记录

## 问题

- 上传分析完成后没有进入分析报告页
- 历史日志存档中的“查看报告”只是按钮，没有可用链接
- 分析记录依赖 `logs.created_at` 取数，但日志表真实字段是 `uploaded_at`

## 本次改动

- `app/dashboard/analyses/page.tsx`
  现在支持读取 `logId` 查询参数，并把它传给静态分析报告页

- `app/logs/actions.ts`
  server action 上传成功后改为跳转到 `/dashboard/analyses?logId=<id>`

- `app/api/logs/upload/route.ts`
  静态上传页上传成功后返回的 `redirectTo` 改为分析报告页入口

- `public/inner-pages/历史日志存档/code.html`
  “查看报告”改为真正可点击的报告链接

- `app/api/inner-data/route.ts`
  `history-logs` 与 `analyses` 视图改为使用 `logs.uploaded_at`
  `analysis-report` 视图也改为按 `uploaded_at` 读取日志时间

## 结果

- 上传完成后默认进入分析报告页
- 历史日志存档可以打开指定日志的分析报告
- 分析记录与历史日志存档能够正常读取日志列表
