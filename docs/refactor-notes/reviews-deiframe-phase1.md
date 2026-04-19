# 人工复核去 iframe 第一阶段记录

## 背景
工作台已完成去 iframe 试点，下一步按迁移顺序进入 `人工复核`。该页面当前仍依赖 `StaticInnerPage + /inner-pages/人工复核/code.html`。

## 本次调整
1. 新建人工复核数据 helper，复用现有 review / history-cases 数据口径。
2. 将 `/dashboard/reviews` 切换为真实 Next 页面。
3. 让 dashboard 公共壳支持人工复核路由。
4. 让顶栏标题按路由切换，避免工作台标题误用。

## 影响范围
- 影响 `/dashboard/reviews` 与 dashboard 公共壳。
- 不影响未迁移的其它 iframe dashboard 页面。
- 不改 review 相关字段结构。
