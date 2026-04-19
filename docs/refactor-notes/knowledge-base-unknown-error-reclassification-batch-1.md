# 主知识库 unknown_error 首批纠偏 Refactor Notes

## 本轮目标

清理主知识库中遗留的 `unknown_error` 元数据，让 RAG 能更稳定地利用 `error_type` 做过滤和重排。

## 本轮新增

- [docs/knowledge-base-unknown-error-reclassification-batch-1.md](/c:/智能日志分析系统/next-app/docs/knowledge-base-unknown-error-reclassification-batch-1.md)
- [supabase/phase-8d-knowledge-base-unknown-error-reclassification-batch-1.sql](/c:/智能日志分析系统/next-app/supabase/phase-8d-knowledge-base-unknown-error-reclassification-batch-1.sql)

## 解决的问题

1. 一批内容本身有效的知识条目仍停留在 `unknown_error`
2. 元数据过滤无法准确召回这些条目
3. 同类中英文案例的分类口径不一致

## 结果

现在开始形成“先保守落类、再批次纠偏”的治理方式：

- 只改可稳定判断的条目
- 同步修正旧兼容字段
- 保留少量边界型案例到后续批次
