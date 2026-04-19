# 规则配置管理第一阶段迁移记录

## 本轮目标
- 将 `/dashboard/rules` 从 `StaticInnerPage + iframe` 切换为真实 Next 页面
- 保持原“规则配置管理”米色系统管理页面的标题区、切换条、统计卡片、筛选区、规则表格和分页结构不变
- 继续复用现有 `/api/inner-data` 的 `rules-*` 动作，不改字段契约

## 实施内容
1. 新增 `lib/dashboard/rules.ts`
   - 直接查询 `detection_rules`
   - 输出与现有 `view=rules` 兼容的 `stats + rows` 首屏数据
2. 新增 `components/dashboard/pages/rules/rules-page.tsx`
   - 还原规则配置页标题区、系统管理切换条、沉淀链路提示、统计卡片、筛选区、规则表格、分页
   - 客户端继续调用 `/api/inner-data` 的 `rules-toggle`、`rules-rename`、`rules-duplicate`、`rules-delete`
3. 替换 `app/dashboard/rules/page.tsx`
   - 去掉 `StaticInnerPage`
   - 改为直接渲染 `RulesPage`
4. 更新 dashboard 公共壳映射
   - `DashboardLayout` 纳入 `/dashboard/rules`
   - `DashboardTopbar` 增加“工作台·系统管理 / 规则配置管理”标题

## 结果
- `/dashboard/rules` 不再依赖 iframe
- 规则启停、重命名、复制、删除仍然沿用现有接口动作
- 规则页已纳入统一 dashboard 公共壳，后续可以继续按同一模式迁移剩余系统管理页
