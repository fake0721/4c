# 历史日志行内动作对接记录

## 本次调整
- 历史日志存档页的行内 `下载` 按钮继续复用 `/api/inner-data` 的 `history-download`，但前端触发方式从 `window.open` 改成真实锚点下载，避免被浏览器当成弹窗拦截后表现成“假按钮”。
- 行内 `删除` 按钮继续复用 `/api/inner-data` 的 `history-delete`，删除成功后除了本地移除当前行，还会触发 `router.refresh()`，让分页和右侧概览重新与服务端数据对齐。
- `history-delete` 与共享日志删除 action 的成功判定补强为“必须真的删到数据库记录”，不再把 0 行删除误判成成功，避免刷新后日志又回到列表里。
- 对没有 `storagePath` 的日志行，下载按钮改为禁用态，并显示“该日志没有可下载文件”的提示，避免继续误导点击。
- 页面新增轻量成功/失败反馈条，替代原先纯 `alert` 弹窗，让用户能直接感知动作是否真的执行。

## 兼容边界
- 未修改 `/api/inner-data` 的 `history-download` / `history-delete` 入参和返回字段。
- 未修改 `logs` 相关表字段口径。
- 未调整历史日志存档页整体结构与视觉层级。

## 后续补充
- 排查到 `public.logs` 缺少 `DELETE` RLS 策略，导致已登录用户在 UI 中发起删除时会被数据库权限拦截。
- 已补充 `logs_delete_own` 策略，条件为 `auth.uid() = user_id`，只允许用户删除自己的日志。

## 验证
- `npx eslint components/dashboard/pages/tasks/tasks-page.tsx` 通过。
- `npm run lint` 未通过，但失败原因来自仓库中其他已有文件的存量问题，不是本次改动引入。
