# 静态历史页编码恢复记录

## 变更目标
- 修复 `历史日志存档` 与 `分析记录` 页面的乱码和错误跳转。
- 保持原有 dashboard 静态 iframe 视觉不变。

## 本次改动
- 新增 `docs/static-history-page-encoding-recovery-spec.md`。
- `public/inner-pages/历史日志存档/code.html`
  - 从 `HEAD` 恢复正常中文与正确静态链接
  - 保留动态“查看报告”跳转到 `/dashboard/analyses?logId=<id>`
- `public/inner-pages/分析记录/code.html`
  - 从 `HEAD` 恢复正常中文与正确静态链接
  - 保留动态“查看详情”跳转到 `/dashboard/analyses?logId=<id>`

## 兼容性说明
- dashboard 路由不变。
- `日志上传`、`历史与知识` 的侧边栏入口恢复为正常中文页面路径。
- 真实报告仍通过 `/dashboard/analyses` 进入。