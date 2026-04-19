# 分析报告 iframe 兼容规范

## 背景
- 当前 `/dashboard/analyses` 通过 `StaticInnerPage` 加载静态报告页。
- 用户在上传分析完成后进入报告页，刷新后出现白屏空白 iframe。
- 现有报告静态页 `public/inner-pages/分析报告/code.html` 内容仍然存在，问题集中在 iframe 入口兼容性。

## 目标
- 保留原有可视化分析报告页面样式与结构不变。
- 不改动分析报告静态 HTML 的主体布局。
- 修复上传跳转或手动刷新后 iframe 为空白的问题。

## 方案
1. 为分析报告静态页增加 ASCII 路径别名，避免中文静态资源路径在 iframe + query 场景下出现兼容问题。
2. `/dashboard/analyses` 改为加载 ASCII 别名入口。
3. `StaticInnerPage` 内的 iframe 使用 `key=src`，确保路径变化时强制重建 frame，而不是复用旧实例。

## 边界
- 不重写 `public/inner-pages/分析报告/code.html` 视觉结构。
- 不改上传分析写库逻辑。
- 不改 `analysis-report` 数据接口字段。