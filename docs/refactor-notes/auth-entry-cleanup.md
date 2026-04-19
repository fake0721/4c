# Auth Entry Cleanup

## 本轮目标
- 收口旧首页、登录、注册、忘记密码静态入口。
- 修复真实注册页乱码，并移除登录页不再需要的会话说明文案。

## 实际落地
1. 修复 `app/register/page.tsx` 的中文文案、占位符与跳转文案。
2. 调整 `app/login/page.tsx`，去掉顶部多余会话说明，只保留必要登录表单。
3. 将 `public/inner-pages/首页/code.html` 改为跳转 `/` 的静态跳转页。
4. 将 `public/inner-pages/登录/code.html` 改为跳转 `/login` 的静态跳转页。
5. 将 `public/inner-pages/注册/code.html` 改为跳转 `/register` 的静态跳转页。
6. 将 `public/inner-pages/忘记密码/code.html` 改为跳转 `/auth/reset-password` 的静态跳转页。

## 兼容性说明
- 未修改登录、注册、密码找回的服务端动作契约。
- 旧静态入口仍可访问，但只会跳转到真实 Next 路由。

## 验收点
- `/login`、`/register`、`/auth/reset-password` 文案正常，无乱码。
- 旧静态认证入口不会再显示过时页面。
