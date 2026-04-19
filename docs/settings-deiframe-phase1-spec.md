# 系统设置第一阶段规范

## 目标
- 将 `/dashboard/settings` 从旧静态 inner-page 收口为真实 Next 页面
- 保持当前米色系统管理页的标题区、系统管理切换条、模型配置、全局参数与导出模板管理结构
- 复用现有 `view=settings`、`update-system-settings`、`update-export-templates` 与 `upload-export-template-file` 契约

## 范围
1. `app/dashboard/settings/page.tsx`
2. `components/dashboard/pages/settings/*`
3. `lib/dashboard/settings.ts`
4. `components/dashboard/shell/dashboard-layout.tsx`
5. `components/dashboard/shell/dashboard-topbar.tsx`
6. `components/dashboard/shell/dashboard-sidebar.tsx`
7. `components/dashboard/pages/rules/rules-page.tsx`
8. `docs/settings-deiframe-phase1-spec.md`
9. `docs/refactor-notes/settings-deiframe-phase1.md`
10. `智能日志分析系统任务清单.txt`

## 实施要求
1. 首屏设置数据由 `lib/dashboard/settings.ts` 提供，字段与现有 `view=settings` 保持一致。
2. 页面首轮覆盖：模型配置、全局参数、导出模板管理、系统管理切换条与保存动作。
3. 规则页中的“系统设置”入口切到 `/dashboard/settings`，性能分析入口暂时保留旧静态页。
4. 不修改 `/api/inner-data` 相关 settings 契约。

## 非目标
- 不迁移 `/inner-pages/性能分析/code.html`
- 不删除 `public/inner-pages/系统设置`
- 不清理其它低频静态页链接

## 验收标准
1. `/dashboard/settings` 可直接访问且不再依赖 iframe。
2. 模型配置、全局参数与模板管理可基于真实数据读写。
3. `eslint` 与 `npm run build` 通过。

