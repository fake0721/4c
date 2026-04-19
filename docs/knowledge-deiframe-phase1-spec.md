# Knowledge Deiframe Phase 1 Spec

## 背景
- “探索根因知识库”当前仍停留在 `public/inner-pages/探索根因知识库/code.html`。
- 历史与知识相关的新 Next 页面中仍存在指向旧静态知识页的入口，导致主流程没有完全收口。
- `/api/inner-data?view=knowledge` 已有真实数据口径，可直接复用，不需要新造接口。

## 目标
1. 新建真实 `/dashboard/knowledge` 页面，纳入当前 dashboard 公共壳。
2. 保持“历史与知识”分组下的米色视觉层次，不重画整体交互风格。
3. 继续复用现有 `knowledge_base` 字段与 `view=knowledge` 数据含义。
4. 将旧静态知识页改为跳转页，阻断过时页面再次进入主流程。

## 实施范围
- `app/dashboard/knowledge/page.tsx`
- `components/dashboard/pages/knowledge/knowledge-page.tsx`
- `lib/dashboard/knowledge.ts`
- `components/dashboard/shell/dashboard-layout.tsx`
- `components/dashboard/shell/dashboard-topbar.tsx`
- `components/dashboard/shell/dashboard-sidebar.tsx`
- `components/dashboard/pages/tasks/tasks-page.tsx`
- `components/dashboard/pages/history-cases/history-cases-page.tsx`
- `public/inner-pages/探索根因知识库/code.html`

## 不做项
- 不改 `app/api/inner-data/route.ts` 的 `knowledge` 输出结构。
- 不处理首页、登录、注册、忘记密码等独立静态入口。
- 不修改知识导入、规则生成、RAG 检索或模型分析逻辑。

## 验收标准
1. `/dashboard/knowledge` 可用且使用统一 dashboard 公共壳。
2. 页面包含搜索、高级筛选、热门关键词、知识卡片和分页。
3. 历史日志存档、历史问题库中的知识库入口改为 `/dashboard/knowledge`。
4. 旧静态知识页访问时自动跳转到 `/dashboard/knowledge`。
5. `eslint` 与 `npm run build` 通过。
