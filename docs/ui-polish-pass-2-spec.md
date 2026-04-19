# UI Polish Pass 2 Spec

## 背景
- 上传页侧栏底部按钮被全局改成了“进入分析记录”，但用户只希望 `/upload` 页面特殊显示。
- 人工复核原静态页中存在“复核说明 / 处置方案”人工填写区，当前 Next 版本遗漏。
- 历史日志存档与历史问题库右上角仍保留导出按钮，用户要求移除。

## 目标
1. 仅在 `/upload` 页面显示“进入分析记录”按钮。
2. 在人工复核页补回用户填写处理方法/知识沉淀说明的输入区。
3. 删除两个历史页头部导出按钮。

## 实施范围
- `components/dashboard/shell/dashboard-sidebar.tsx`
- `components/dashboard/pages/reviews/reviews-page.tsx`
- `components/dashboard/pages/reviews/review-detail.tsx`
- `components/dashboard/pages/tasks/tasks-page.tsx`
- `components/dashboard/pages/history-cases/history-cases-page.tsx`

## 不做项
- 不修改任何 API 返回结构和数据库字段。
- 不新增人工复核保存接口。
- 不调整上传页内容布局和其它页面导航结构。

## 验收标准
1. `/upload` 页侧栏底部按钮显示“进入分析记录”，其它页面仍为“开始新分析”。
2. 人工复核页存在可编辑的“复核说明 / 处置方案”输入区。
3. 历史日志存档和历史问题库右上角导出按钮被移除。
4. `eslint` 与 `npm run build` 通过。
