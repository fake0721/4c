# 分析记录去 iframe 第一阶段记录

## 背景
工作台与人工复核已完成迁移，下一步进入 `分析记录` 页面。该页当前仍依赖 `StaticInnerPage + /inner-pages/分析记录/code.html`。

## 本次调整
1. 新建分析记录数据 helper，复用现有 analyses 数据口径。
2. 将 `/dashboard/high-risk` 切换为真实 Next 页面。
3. 让 dashboard 公共壳支持分析记录路由。
4. 让顶栏标题支持“工作台·日志分析 / 分析记录”。

## 影响范围
- 影响 `/dashboard/high-risk` 与 dashboard 公共壳。
- 不影响未迁移的其它 iframe dashboard 页面。
- 不改 analyses 相关字段结构。
