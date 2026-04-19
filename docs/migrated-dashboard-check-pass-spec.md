# 已迁 Dashboard 页面总检查补漏规范

## 背景
- 工作台、人工复核、分析记录、个人页面已迁入 Next。
- 本轮人工检查中确认存在公共壳层缺漏，而不是页面数据层缺漏。

## 已确认问题
1. 侧栏高亮仅按路由完全相等判断，导致部分已迁页没有落到正确业务分组。
2. 顶栏沿用了旧浅色文字/图标类名，在当前米色壳层下可读性偏弱。

## 目标
1. 只修复公共壳的这两处缺漏。
2. 不改页面数据契约。
3. 不进入下一页迁移。

## 范围
- `components/dashboard/shell/dashboard-sidebar.tsx`
- `components/dashboard/shell/dashboard-topbar.tsx`

## 验收标准
1. 已迁页面在侧栏上能落到正确分组。
2. 顶栏在米色背景下可读性正常。
3. `eslint` 通过。
4. `npm run build` 通过。
