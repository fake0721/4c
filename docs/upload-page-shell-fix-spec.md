# Upload Page Shell Fix Spec

## 背景
- 当前 `/upload` 仍然使用独立页面壳，自带一套侧栏和顶栏，已经与 dashboard 主流程脱节。
- 该页面源码存在乱码和过时文案残留风险，导致上传页观感混乱。
- 旧静态入口 `public/inner-pages/日志上传/code.html` 仍然存在，容易再次把用户带回过时上传页。

## 目标
1. 让 `/upload` 复用当前 dashboard 公共壳，只保留一套渲染流程。
2. 保持现有米色上传页内容区视觉，不重画上传区域结构。
3. 保持 `logFile`、`sourceType` 字段兼容，继续走 `createLogUploadAction`。
4. 让旧静态上传入口直接跳转到 `/upload`。

## 实施范围
- `app/upload/page.tsx`
- `components/dashboard/pages/upload/upload-page.tsx`
- `components/dashboard/shell/dashboard-layout.tsx`
- `components/dashboard/shell/dashboard-topbar.tsx`
- `app/logs/actions.ts`
- `public/inner-pages/日志上传/code.html`

## 不做项
- 不迁移“探索根因知识库”及其它剩余低频静态页。
- 不改 `upload-service` 的分析逻辑、RAG、规则层或模型层。
- 不修改数据库字段名、表结构和上传动作字段名。

## 验收标准
1. `/upload` 在视觉上和当前 dashboard 主壳一致，不再出现重复侧栏/顶栏。
2. 页面文案、来源类型、文件选择、删除已选文件、提交按钮状态正常。
3. 上传失败时回到 `/upload`，不再错误跳回 `/dashboard`。
4. 旧静态上传页访问时会自动跳转到 `/upload`。
5. `eslint` 与 `npm run build` 通过。
