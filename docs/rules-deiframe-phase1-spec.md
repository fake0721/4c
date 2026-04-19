# 规则配置管理第一阶段迁移规范

## 背景
- `/dashboard/rules` 当前仍通过 `StaticInnerPage` 加载 `public/inner-pages/规则配置管理/code.html`
- dashboard 公共壳已覆盖工作台、人工复核、分析记录、个人页面、历史日志存档、问题处理，规则配置管理应继续按同样模式迁入 Next

## 目标
1. 将 `/dashboard/rules` 改为真实 Next 页面
2. 保持当前“规则配置管理”米色视觉、统计卡片、筛选条、规则表格和分页不变形
3. 继续复用现有规则启停、重命名、复制、删除动作

## 范围
- `app/dashboard/rules/page.tsx`
- `components/dashboard/shell/dashboard-layout.tsx`
- `components/dashboard/shell/dashboard-topbar.tsx`
- `lib/dashboard/rules.ts`
- `components/dashboard/pages/rules/*`

## 实施要求
1. 首屏数据由 `lib/dashboard/rules.ts` 提供，字段口径与 `view=rules` 保持一致
2. 第一阶段需要覆盖：
   - 页面标题区
   - 系统管理自由切换条
   - 沉淀链路提示区
   - 规则统计卡片
   - 规则类型 / 运行状态筛选区
   - 规则表格与分页
3. 规则启停、重命名、复制、删除继续调用 `/api/inner-data` 的 `rules-toggle`、`rules-rename`、`rules-duplicate`、`rules-delete`
4. 暂不迁移性能分析与系统设置子页

## 非目标
- 不修改 `/api/inner-data` 的 rules 返回结构
- 不删除 `StaticInnerPage` 或 `public/inner-pages`
- 不进入规则层、模型层、RAG 层

## 验收标准
1. `/dashboard/rules` 不再走 iframe
2. 视觉和层次接近原静态规则配置管理页
3. 启停、重命名、复制、删除动作可用
4. `eslint` 通过
5. `npm run build` 通过
