# History Cases Build Field Alignment Refactor Notes

## 变更摘要
- 为 `history-cases` 已完成复盘查询补充 `final_error_type` 字段。

## 影响范围
- `lib/dashboard/history-cases.ts`

## 兼容性
- 页面返回结构未变化。
- 仅修复查询字段和消费字段的对齐问题。

## 结果预期
- 构建阶段的 `final_error_type` 类型错误消失。
- 历史回补案例标题可继续优先使用复盘后的问题类型。
