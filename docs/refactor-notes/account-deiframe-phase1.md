# 个人页面第一阶段迁移记录

## 变更目标
- 将 `/dashboard/account` 从 `StaticInnerPage` 迁为真实 Next 页面。
- 保持现有个人页的米色玻璃态布局与主要交互文案。
- 继续复用现有账号数据与更新接口，不改字段契约。

## 实际改动
1. 新增 `lib/dashboard/account.ts`
   - 复用现有 `account` 数据口径，提供个人页首屏 profile 数据。
2. 新增 `components/dashboard/pages/account/account-page.tsx`
   - 覆盖头像与基础信息、个人资料、密码修改、最近登录设备空态区。
   - 头像支持本地预览与 URL 预览。
   - 资料保存继续走 `/api/inner-data` 的 `update-profile`。
   - 密码修改继续走 `/api/inner-data` 的 `update-password`。
3. 更新 `app/dashboard/account/page.tsx`
   - 取消 iframe，改为直接渲染新的个人页组件。
4. 更新 dashboard 公共壳
   - `dashboard-layout.tsx` 将 `/dashboard/account` 纳入已迁移路由。
   - `dashboard-topbar.tsx` 为个人页面补上路由标题。
   - `dashboard-sidebar.tsx` 让个人页面维持在“系统管理”导航态下。

## 说明
- 原静态页中的“最近登录设备”写死演示数据已不再保留，当前改为明确空态，避免继续展示假内容。

## 验证
- `npx eslint app/dashboard/account/page.tsx components/dashboard/pages/account/*.tsx components/dashboard/shell/*.tsx lib/dashboard/account.ts`
- `npm run build`
