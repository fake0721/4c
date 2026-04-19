# Inner Pages Final Cleanup Spec

## 背景
- Dashboard 与主流程页面已经迁入真实 Next 路由，不再依赖 iframe。
- 仓库中仍保留 `public/inner-pages` 静态目录，内容包括旧 `code.html`、截图和说明文件。
- 当前应用代码里已无 `StaticInnerPage` 与 iframe 运行时引用，剩余静态页仅用于历史兼容和旧地址残留。

## 目标
1. 在不影响当前 Next 页面运行的前提下，移除 `public/inner-pages` 目录。
2. 为旧 `/inner-pages/*` 地址提供稳定跳转，避免旧书签或旧入口直接失效。
3. 彻底结束旧静态页与 iframe 兼容层。

## 实施范围
- `proxy.ts`
- `public/inner-pages/**`

## 跳转策略
- `/inner-pages/工作台(/code.html)` -> `/dashboard`
- `/inner-pages/日志上传(/code.html)` -> `/upload`
- `/inner-pages/问题中心(/code.html)` -> `/dashboard/incidents`
- `/inner-pages/人工复核(/code.html)` -> `/dashboard/reviews`
- `/inner-pages/分析记录(/code.html)` -> `/dashboard/high-risk`
- `/inner-pages/分析报告(/code.html)` -> `/dashboard/analyses`
- `/inner-pages/analysis-report(/code.html)` -> `/dashboard/analyses`
- `/inner-pages/历史日志存档(/code.html)` -> `/dashboard/tasks`
- `/inner-pages/历史问题库(/code.html)` -> `/dashboard/history-cases`
- `/inner-pages/规则配置管理(/code.html)` -> `/dashboard/rules`
- `/inner-pages/性能分析(/code.html)` -> `/dashboard/performance`
- `/inner-pages/系统设置(/code.html)` -> `/dashboard/settings`
- `/inner-pages/个人页面(/code.html)` -> `/dashboard/account`
- `/inner-pages/帮助中心(/code.html)` -> `/dashboard/help`
- `/inner-pages/技术文档(/code.html)` -> `/dashboard/docs`
- `/inner-pages/探索根因知识库(/code.html)` -> `/dashboard/knowledge`
- `/inner-pages/首页(/code.html)` -> `/`
- `/inner-pages/登录(/code.html)` -> `/login`
- `/inner-pages/注册(/code.html)` -> `/register`
- `/inner-pages/忘记密码(/code.html)` -> `/auth/reset-password`

## 不做项
- 不改现有 Next 页面结构和数据来源。
- 不删除 `public/vendor` 等仍在使用的静态资源。
- 不修改认证或业务接口契约。

## 验收标准
1. `public/inner-pages` 目录被移除。
2. 旧 `/inner-pages/*` 页面路径会自动跳到真实 Next 路由。
3. 仓库不再保留 iframe 运行时依赖。
4. `eslint` 与 `npm run build` 通过。
