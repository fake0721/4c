# Upload Page Shell Fix

## 本轮目标
- 将 `/upload` 收口到当前 dashboard 公共壳。
- 修复上传页源码中的乱码和独立旧壳残留。
- 让旧静态上传页只作为跳转入口，不再展示过时页面。

## 实际落地
1. 新增 `components/dashboard/pages/upload/upload-page.tsx`，将上传页内容区改为独立 React 组件。
2. 将 `app/upload/page.tsx` 改为服务端入口，复用 `getDashboardShellData` 与 `DashboardLayout`。
3. 扩展 `DashboardLayout` 与 `DashboardTopbar`，使 `/upload` 进入统一公共壳，并显示“工作台·日志分析 / 日志上传”。
4. 调整 `createLogUploadAction` 的错误回跳目标与中文提示，上传失败时回到 `/upload`。
5. 将 `public/inner-pages/日志上传/code.html` 改为跳转页，彻底阻断过时上传页面再次展示。

## 兼容性说明
- `logFile` 与 `sourceType` 字段名保持不变。
- 上传提交仍走 `createLogUploadAction` -> `uploadAndAnalyzeLog` -> 分析报告详情页。
- 旧静态上传页路径仍可访问，但只会跳转到真实 `/upload`。

## 验收点
- `/upload` 与 dashboard 主流程视觉一致，不再重复侧栏/顶栏。
- 文件选择、拖拽、移除、来源类型选择和提交按钮状态正常。
- 旧静态上传页不会再显示过时 UI。
