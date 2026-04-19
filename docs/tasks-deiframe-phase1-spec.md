# 历史日志存档第一阶段迁移规范

## 背景
- `/dashboard/tasks` 当前仍通过 `StaticInnerPage` 加载 `public/inner-pages/历史日志存档/code.html`。
- dashboard 公共壳已覆盖工作台、人工复核、分析记录、个人页面，历史日志存档应继续按同样模式迁入 Next。

## 目标
1. 将 `/dashboard/tasks` 改为真实 Next 页面。
2. 保持当前“历史与知识”页的米色视觉、标题层次、筛选条、表格和右侧概览区不变形。
3. 继续复用现有历史日志数据与下载/删除动作，不改字段契约。

## 范围
- `app/dashboard/tasks/page.tsx`
- `components/dashboard/shell/dashboard-layout.tsx`
- `components/dashboard/shell/dashboard-topbar.tsx`
- `lib/dashboard/tasks.ts`
- `components/dashboard/pages/tasks/*`

## 实施要求
1. 首屏数据由 `lib/dashboard/tasks.ts` 提供，字段口径与 `view=history-logs` 保持一致。
2. 第一阶段需覆盖：
   - 页面标题区
   - 历史与知识切换条
   - 筛选区
   - 历史日志表格与分页
   - 右侧知识沉淀与趋势概览
3. 下载和删除继续复用 `/api/inner-data` 的 `history-download` / `history-delete`。
4. 暂不迁移“探索根因知识库”和“历史问题库”，可继续保留旧入口链接。

## 非目标
- 不迁移知识库子页。
- 不改 `/api/inner-data` 字段结构。
- 不删除 `StaticInnerPage` 或 `public/inner-pages`。

## 验收标准
1. `/dashboard/tasks` 不再走 iframe。
2. 标题、筛选、表格、分页与右侧概览在视觉上接近原静态页。
3. 下载与删除动作可用。
4. `eslint` 通过。
5. `npm run build` 通过。
