# 系统支持页第一阶段规范

## 目标
- 将侧边栏中的“帮助中心”“技术文档”从旧静态 inner-pages 收口到真实 dashboard 路由
- 保持当前米色支持页的英雄区、目录侧栏、内容分块和顶部切换入口
- 减少低频静态页在运行时主链路中的直接依赖

## 范围
1. `app/dashboard/help/page.tsx`
2. `app/dashboard/docs/page.tsx`
3. `components/dashboard/pages/support/*`
4. `components/dashboard/shell/dashboard-layout.tsx`
5. `components/dashboard/shell/dashboard-topbar.tsx`
6. `components/dashboard/shell/dashboard-sidebar.tsx`
7. `docs/support-pages-phase1-spec.md`
8. `docs/refactor-notes/support-pages-phase1.md`
9. `智能日志分析系统任务清单.txt`

## 实施要求
1. 新页面直接使用 dashboard 公共壳，不再依赖 iframe 或静态 HTML 运行时。
2. 帮助中心与技术文档允许共用一个内容模板，但要保留各自的目录、标题、文案和顶部切换按钮。
3. 侧边栏底部帮助中心与技术文档入口改为新的 dashboard 路由，视觉风格保持现状。
4. 不改规则层、模型层、RAG 层与 `/api/inner-data` 契约。

## 非目标
- 不迁移“性能分析”“系统设置”“历史问题库”“探索根因知识库”
- 不删除 `public/inner-pages/帮助中心` 与 `public/inner-pages/技术文档`
- 不清理其它仍指向 `public/inner-pages` 的低频链接

## 验收标准
1. `/dashboard/help` 与 `/dashboard/docs` 可直接访问。
2. 侧边栏帮助中心与技术文档入口已改为真实 Next 路由。
3. `eslint` 与 `npm run build` 通过。
