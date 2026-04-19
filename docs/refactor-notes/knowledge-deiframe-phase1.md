# Knowledge Deiframe Phase 1

## 本轮目标
- 将“探索根因知识库”纳入真实 dashboard 路由。
- 保留“历史与知识”页组的现有米色视觉层次。
- 收口 tasks 与历史问题库页面里残留的旧静态知识库入口。

## 实际落地
1. 新建 `lib/dashboard/knowledge.ts`，直接读取 `knowledge_base` 并输出知识卡片所需字段。
2. 新建 `components/dashboard/pages/knowledge/knowledge-page.tsx`，完成标题区、切换条、搜索、高级筛选、热门关键词、知识卡片、详情弹层与分页。
3. 新建 `app/dashboard/knowledge/page.tsx`，将知识库接入真实 dashboard 路由。
4. 扩展 `DashboardLayout`、`DashboardTopbar`、`DashboardSidebar`，使 `/dashboard/knowledge` 进入统一公共壳并落在“历史与知识”分组。
5. 将 `tasks-page` 与 `history-cases-page` 中指向旧静态知识页的入口改为 `/dashboard/knowledge`。
6. 将 `public/inner-pages/探索根因知识库/code.html` 改为跳转页，阻断过时知识页再次进入主流程。

## 兼容性说明
- 未修改 `/api/inner-data` 的 `view=knowledge` 结构。
- 未改知识导入、规则沉淀或 RAG 检索逻辑。
- 旧静态知识库路径仍可访问，但只会跳转到新页面。

## 验收点
- `/dashboard/knowledge` 使用统一 dashboard 公共壳。
- 搜索、分类筛选、来源筛选、热门关键词和分页正常。
- 历史与知识切换条已全部指向真实 dashboard 路由。
- 旧知识库页不会再显示过时静态 UI。
