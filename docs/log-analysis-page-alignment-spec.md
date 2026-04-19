# 日志分析页面归位规范

## 目标
- 上传日志并完成分析后，必须直接进入该次任务的真实分析详情页。
- 分析记录页只承担“列表入口”职责，不直接承载单条报告详情。
- 历史日志存档页继续承担“历史归档列表”职责。

## 路由职责
- `/dashboard/logs/[logId]`
  - 真实分析详情页
  - 直接读取 `logs / log_errors / analysis_results / Storage` 的实时数据
- `/dashboard/analyses`
  - 分析记录列表页
  - 展示最近的分析任务、状态、风险、问题数量
- `/dashboard/tasks`
  - 历史日志存档页
  - 展示归档后的日志与历史知识概览

## 跳转规则
- 上传成功后：跳转到 `/dashboard/logs/[logId]`
- 分析记录页“查看详情”：跳转到 `/dashboard/logs/[logId]`
- 历史日志页“查看报告”：跳转到 `/dashboard/logs/[logId]`

## 兼容要求
- 保留现有静态内页外观，不重写整套 UI。
- 只调整顶层路由职责与静态页中的链接目标。
- 保持 `logId` 作为单条分析任务的唯一跳转参数。
