# 分析报告 iframe 空白修复记录

## 变更目标
- 修复 `/dashboard/analyses` 在刷新或上传跳转后出现白屏空 iframe 的问题。
- 保持原有分析报告页面样式不变。

## 本次改动
- 新增 `docs/analysis-report-iframe-compat-spec.md`，明确兼容修复边界。
- `app/dashboard/analyses/page.tsx`
  - 改为指向 ASCII 别名静态报告路径 `/inner-pages/analysis-report/code.html`
- `components/dashboard/static-inner-page.tsx`
  - 为 iframe 增加 `key={src}`，避免路径变更后复用旧 iframe 实例
- 新增 `public/inner-pages/analysis-report/code.html`
  - 作为 `public/inner-pages/分析报告/code.html` 的兼容别名入口

## 兼容性说明
- `/dashboard/analyses?logId=<id>` 对外路由不变。
- 报告页内部数据仍继续读取 `/api/inner-data?view=analysis-report&logId=<id>`。
- 现有历史日志、分析记录、上传完成跳转不需要再改链接格式。