# 个人页面第一阶段迁移规范

## 背景
- `/dashboard/account` 当前仍通过 `StaticInnerPage` 加载 `public/inner-pages/个人页面/code.html`。
- dashboard 公共壳、工作台、人工复核、分析记录已逐步迁入 Next，个人页面需要按同样模式脱离 iframe。

## 目标
1. 将 `/dashboard/account` 改为真实 Next 页面。
2. 保持现有米色 dashboard 视觉体系与原静态个人页文案、布局外观一致。
3. 继续复用现有账号数据与更新接口，不改字段契约。

## 范围
- `app/dashboard/account/page.tsx`
- `components/dashboard/shell/dashboard-layout.tsx`
- `components/dashboard/shell/dashboard-topbar.tsx`
- `lib/dashboard/account.ts`
- `components/dashboard/pages/account/*`

## 实施要求
1. 首屏数据由 `lib/dashboard/account.ts` 提供，字段口径与 `view=account` 保持一致。
2. 页面首轮需覆盖：
   - 头像与基础信息
   - 个人资料编辑
   - 密码修改
   - 最近登录设备区域
3. 最近登录设备不允许继续保留写死假数据；若暂无真实审计数据，则展示明确空态。
4. 头像本地预览、头像 URL、资料保存、密码修改需保持可用。
5. 不回退 iframe，不在新页面中继续使用手写 DOM 更新脚本。

## 非目标
- 不改 `/api/inner-data` 的 `account` / `update-profile` / `update-password` 契约。
- 不推进 `tasks`、`rules`、`incidents` 页面迁移。
- 不删除 `StaticInnerPage` 或 `public/inner-pages`。

## 验收标准
1. `/dashboard/account` 不再走 iframe。
2. 视觉上保持与原静态个人页面一致。
3. 资料保存、密码修改、头像预览正常。
4. `eslint` 通过。
5. `npm run build` 通过。
