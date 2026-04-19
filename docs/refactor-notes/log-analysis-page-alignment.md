# 日志分析页面归位说明

## 本次调整
- 纠正“分析报告详情页”和“分析记录列表页”职责混用的问题。
- 上传完成后的跳转重新指向真实详情页 `/dashboard/logs/[logId]`。
- `/dashboard/analyses` 恢复为分析记录列表入口。
- 历史日志与分析记录中的查看入口统一跳转到真实详情页。

## 原因
- 之前把 `/dashboard/analyses` 同时当作“分析记录列表”和“单条报告详情”使用，导致用户上传后进入静态模板页，和真实详情页不一致。
- 数据库里实际已有分析数据，但错误的路由归位让用户看到的是错误页面。

## 影响范围
- `app/dashboard/analyses/page.tsx`
- `app/api/logs/upload/route.ts`
- `app/logs/actions.ts`
- `public/inner-pages/历史日志存档/code.html`
- `public/inner-pages/分析记录/code.html`
