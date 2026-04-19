# 兼容层清理第一阶段规范

## 目标
- 清理已经没有运行时引用的 `StaticInnerPage` 兼容组件
- 保留仍被低频静态入口和历史链接使用的 `public/inner-pages`
- 在不影响已迁 Next 页面和未迁低频静态页入口的前提下，缩小 dashboard 兼容层

## 范围
1. `components/dashboard/static-inner-page.tsx`
2. `docs/compat-layer-cleanup-phase1-spec.md`
3. `docs/refactor-notes/compat-layer-cleanup-phase1.md`
4. `智能日志分析系统任务清单.txt`

## 实施要求
1. 先确认 app 与 components 运行时代码中已无 `StaticInnerPage` 活动引用，再删除组件实现。
2. 仅删除未使用的运行时代码，不清理仍有链接关系的静态 `inner-pages` 文件。
3. 不改动已迁页面的数据 helper、页面结构和公共壳行为。
4. 不调整 `/api/inner-data` 现有字段契约与动作契约。

## 非目标
- 不删除 `public/inner-pages/*/code.html`
- 不清理 docs 中保留的历史迁移说明
- 不迁移新的 dashboard 页面

## 验收标准
1. 运行时代码中不再存在 `StaticInnerPage` 组件实现与引用。
2. `npm run build` 继续通过。
3. 帮助中心、技术文档、知识库等仍基于静态 inner-pages 的低频入口不受影响。
