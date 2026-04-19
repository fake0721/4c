# Vercel Build Font Dependency Refactor Notes

## 变更摘要
- 移除根布局对 `next/font/google` 的构建期依赖。
- 将全局字体变量改为本地字体栈定义，保留原有字体类名。

## 影响范围
- `app/layout.tsx`
- `app/globals.css`
- 部署构建链路

## 兼容性
- `.font-headline`、`.font-body`、`.font-label` 继续可用。
- 不涉及业务字段、接口结构、规则输出或数据模型调整。

## 结果预期
- 构建阶段不再因 Google Fonts 网络不可达而失败。
- Vercel 与本地离线环境下的构建稳定性提升。
