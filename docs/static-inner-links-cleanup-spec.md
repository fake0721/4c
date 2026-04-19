# Static Inner Links Cleanup Spec

## 背景
- `public/inner-pages` 目前仍保留作视觉对照与兼容缓冲层。
- 这些静态页内部还残留大量 `../登录/code.html`、`../日志上传/code.html`、`../探索根因知识库/code.html` 等旧跳转。
- 虽然主流程已经切到真实 Next 路由，但如果用户误进静态页，仍可能被带回旧链路。

## 目标
1. 统一静态保留页内部的主要入口跳转到真实 Next 路由。
2. 不删除静态页目录，只修正内部链接。
3. 不影响已迁移的真实 Next 页面与数据契约。

## 实施范围
- `public/inner-pages/*/code.html`
- `docs/static-inner-links-cleanup-spec.md`
- `docs/refactor-notes/static-inner-links-cleanup.md`

## 不做项
- 不删除 `public/inner-pages`。
- 不改动 `app/*`、`components/*`、`lib/*` 下已迁页面代码。
- 不清理 docs 中的历史说明文本。

## 验收标准
1. 静态保留页中的旧登录、旧上传、旧知识库、旧忘记密码入口已改为真实路由。
2. 即使误进入静态保留页，也不会再被带回旧认证/上传流程。
3. `eslint` 与 `npm run build` 通过。
