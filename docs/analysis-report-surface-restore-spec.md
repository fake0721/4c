# 分析报告展示页恢复规范

## 目标
- 保留原有可视化分析报告页的视觉样式与信息结构。
- 上传日志并分析完成后，自动进入该报告展示页。
- 报告展示页继续通过真实接口读取当前 `logId` 的数据，不回退为假数据页面。

## 页面职责
- `/dashboard/analyses?logId=<id>`
  - 作为单条日志的可视化分析报告展示页
  - 内部仍使用 `分析报告/code.html` 的现有样式模板
  - 通过 `/api/inner-data?view=analysis-report&logId=<id>` 灌入真实数据
- `/dashboard/high-risk`
  - 继续承载分析记录列表页
- `/dashboard/tasks`
  - 继续承载历史日志存档页

## 跳转规则
- 上传完成后：跳转到 `/dashboard/analyses?logId=<id>`
- 历史日志“查看报告”：跳转到 `/dashboard/analyses?logId=<id>`
- 分析记录“查看详情”：跳转到 `/dashboard/analyses?logId=<id>`

## 兼容要求
- 不大面积重写现有报告 HTML。
- 保留真实报告详情路由 `/dashboard/logs/[logId]` 作为数据详情备用入口，但默认用户入口回到可视化报告页。
