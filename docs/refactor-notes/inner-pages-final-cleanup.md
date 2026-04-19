# Inner Pages Final Cleanup

## 本轮目标
- 在不影响当前 Next 页面运行的前提下，彻底移除遗留 `public/inner-pages` 静态目录。
- 为旧 `/inner-pages/*` 页面地址保留可回退的统一跳转。

## 实施内容
1. 更新 `proxy.ts`
   - 增加旧 `inner-pages` 页面名到真实 Next 路由的映射表。
   - 支持 `/inner-pages/<页面>` 和 `/inner-pages/<页面>/code.html` 两种旧入口。
   - 保留原有 `/dashboard/*` 登录保护逻辑不变。
   - 将 `matcher` 扩展为同时覆盖 `/dashboard/:path*` 与 `/inner-pages/:path*`。
2. 删除 `public/inner-pages`
   - 移除旧 `code.html`、截图和历史说明文件。
   - 当前仓库不再保留旧静态页运行时资源。

## 结果
- 运行时已不再依赖 iframe 或静态 `code.html` 页面。
- 旧 `/inner-pages/*` 地址会被统一重定向到真实 Next 路由。
- 主流程页面、样式和数据链路没有变动。

## 校验
- `Test-Path public/inner-pages`
  - 返回 `False`
- `npx eslint proxy.ts`
- `npm run build`
