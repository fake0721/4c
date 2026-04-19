# Auth Entry Cleanup Spec

## 背景
- 旧 `public/inner-pages/首页|登录|注册|忘记密码` 仍然存在，容易把用户再次带回过时静态流程。
- 当前真实 `app/register/page.tsx` 仍存在中文乱码。
- 当前真实 `app/login/page.tsx` 仍残留一段不需要展示的会话说明文案。

## 目标
1. 让首页、登录、注册、忘记密码的入口统一回到真实 Next 路由。
2. 修复真实注册页乱码，并收口登录页冗余提示。
3. 保持当前认证页视觉结构，不做大改版。

## 实施范围
- `app/login/page.tsx`
- `app/register/page.tsx`
- `public/inner-pages/首页/code.html`
- `public/inner-pages/登录/code.html`
- `public/inner-pages/注册/code.html`
- `public/inner-pages/忘记密码/code.html`

## 不做项
- 不修改 `signInAction`、`signUpAction`、`requestPasswordResetAction`、`updatePasswordAction` 的行为契约。
- 不删除对应的静态目录，只改为跳转页。
- 不处理其它低频静态内容页。

## 验收标准
1. `/login`、`/register`、`/auth/reset-password` 页面文案正常。
2. 访问旧静态入口会自动跳转到真实路由。
3. `eslint` 与 `npm run build` 通过。
