# UI Polish Pass 2

## 变更范围
- `components/dashboard/shell/dashboard-sidebar.tsx`
- `components/dashboard/pages/reviews/reviews-page.tsx`
- `components/dashboard/pages/reviews/review-detail.tsx`
- `components/dashboard/pages/tasks/tasks-page.tsx`
- `components/dashboard/pages/history-cases/history-cases-page.tsx`

## 本轮调整
1. 侧栏底部主按钮改为仅在 `/upload` 页面显示“进入分析记录”，其它页面仍为“开始新分析”。
2. 人工复核页补回“复核说明 / 处置方案”输入区，用于人工填写处理方法与知识沉淀说明；本轮只做前端交互，不接后端保存。
3. 删除历史日志存档页右上角“批量导出”按钮。
4. 删除历史问题库页右上角“导出报表”按钮。

## 兼容性说明
- 未修改任何 API 契约和数据库字段。
- 上传页、人工复核页和历史页数据 helper 未改字段结构。
- 仅调整页面交互和视觉层。

## 验证
- `npx eslint components/dashboard/shell/dashboard-sidebar.tsx components/dashboard/pages/reviews/reviews-page.tsx components/dashboard/pages/reviews/review-detail.tsx components/dashboard/pages/tasks/tasks-page.tsx components/dashboard/pages/history-cases/history-cases-page.tsx`
- `npm run build`
