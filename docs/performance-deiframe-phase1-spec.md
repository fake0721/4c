# 性能分析第一阶段规范

## 目标
- 将 `/dashboard/performance` 从旧静态 `inner-page` 收口为真实 Next 页面。
- 保持当前系统管理米色视觉语言，不重画页面，不改字段契约。
- 继续复用现有 `view=performance` 的数据口径与导出思路。

## 范围
1. 新建 `app/dashboard/performance/page.tsx`。
2. 新建 `lib/dashboard/performance.ts`。
3. 新建 `components/dashboard/pages/performance/performance-page.tsx`。
4. 更新 dashboard 公共壳映射与标题。
5. 将规则页、系统设置页中的“性能分析”入口改为新路由。

## 不做项
1. 不迁移“历史问题库”“探索根因知识库”。
2. 不修改 `/api/inner-data` 的 `performance` 返回结构。
3. 不删除 `public/inner-pages/性能分析/code.html`。

## 验收
1. `/dashboard/performance` 可直接访问，且不再依赖 iframe。
2. 页面保留系统管理米色风格和三模式对比结构。
3. 时间范围切换、自定义范围和导出按钮可用。
4. `eslint` 与 `npm run build` 通过。
