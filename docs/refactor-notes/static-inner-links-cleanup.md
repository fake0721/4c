# Static Inner Links Cleanup

## 本轮目标
- 对保留在 `public/inner-pages` 中的静态对照页做最后一轮内部链接收口。
- 避免用户误入静态页后再次跳回旧登录、旧上传、旧知识库流程。

## 实际落地
1. 批量替换 `public/inner-pages/*/code.html` 中的旧链接：
   - `../登录/code.html` -> `/login`
   - `../日志上传/code.html` -> `/upload`
   - `../探索根因知识库/code.html` -> `/dashboard/knowledge`
   - `../忘记密码/code.html` -> `/auth/reset-password`
   - `../首页/code.html` -> `/`
   - `../注册/code.html` -> `/register`
2. 内联脚本中的 `window.location.href` 旧目标也同步改为真实 Next 路由。

## 兼容性说明
- 未删除静态页目录，仅修正其内部链接。
- 未修改任何已迁移的真实 Next 页面结构与接口契约。

## 验收点
- 误入保留静态页后，主要跳转入口会回到真实 Next 路由。
- 旧认证、旧上传、旧知识库流程不再被静态页重新带起。
