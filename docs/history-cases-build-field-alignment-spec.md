# History Cases Build Field Alignment Spec

## 背景
- `lib/dashboard/history-cases.ts` 在构建期间触发 TypeScript 报错。
- 报错原因是 `completedReviewRowsResult` 的查询结果未声明 `final_error_type`，但后续在回补案例映射时读取了该字段。

## 问题定义
- 查询字段与消费字段不一致，导致静态类型检查失败。
- 该问题属于历史问题库页面的数据整形层，不涉及规则、模型、RAG 算法变更。

## 约束
- 仅修复 `history-cases` 模块字段对齐。
- 保持现有返回结构和 UI 消费字段兼容。
- 不调整业务逻辑，只补齐缺失查询字段。

## 方案
1. 在已完成复盘的 `review_cases` 查询中补充 `final_error_type`。
2. 保持后续 `recentBackfillCases` 映射逻辑不变。

## 验证
1. 执行 `npm run build`。
2. 确认 `final_error_type` 相关 TypeScript 错误消失。
