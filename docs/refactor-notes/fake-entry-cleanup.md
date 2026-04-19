# Fake Entry Cleanup

## 本轮目标
- 清理规则页和个人页中仍带有演示性质、但没有真实能力支撑的入口或占位区。

## 实施内容
1. 规则页 `components/dashboard/pages/rules/rules-page.tsx`
   - 保留“过滤条件”按钮，并改为滚动定位到页面内真实筛选区。
   - 删除没有后端创建能力支撑的“新增规则”按钮。
   - 删除没有真实动作支撑的右下角 AI 魔法棒悬浮按钮。
2. 个人页 `components/dashboard/pages/account/account-page.tsx`
   - 删除“最近登录设备”安全补充区。
   - 原因是当前 `lib/dashboard/account.ts` 没有任何设备审计数据来源，继续保留只会误导用户。

## 结果
- 规则页只保留真实可用入口，不再展示假的新增/AI 优化能力。
- 个人页不再展示无数据源支撑的设备占位区。

## 校验
- `npx eslint components/dashboard/pages/rules/rules-page.tsx components/dashboard/pages/account/account-page.tsx`
- `npm run build`
