# 历史问题库第一阶段规范

## 目标
- 将 `/dashboard/history-cases` 从旧静态 `inner-page` 收口为真实 Next 页面。
- 保持当前“历史与知识”米色视觉语言，不重画页面，不改字段契约。
- 继续复用现有 `view=history-cases` 的数据口径。

## 范围
1. 新建 `app/dashboard/history-cases/page.tsx`。
2. 新建 `lib/dashboard/history-cases.ts`。
3. 新建 `components/dashboard/pages/history-cases/history-cases-page.tsx`。
4. 更新 dashboard 公共壳映射与标题。
5. 将历史日志页与规则页中的“历史问题库”入口改为新路由。

## 不做项
1. 不迁移“探索根因知识库”。
2. 不修改 `/api/inner-data` 的 `history-cases` 返回结构。
3. 不删除 `public/inner-pages/历史问题库/code.html`。

## 验收
1. `/dashboard/history-cases` 可直接访问，且不再依赖 iframe。
2. 页面保留历史与知识米色风格和问题库表格结构。
3. 筛选、分页、查看复盘跳转可用。
4. `eslint` 与 `npm run build` 通过。
