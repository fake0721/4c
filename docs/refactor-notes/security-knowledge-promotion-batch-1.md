# 安全候选池首批晋升 Refactor Notes

## 本轮目标

把安全候选池中真正适合故障诊断的高频案例，按批次晋升到主知识库，而不是继续停留在“只导入、不使用”的状态。

## 本轮新增

- [docs/security-knowledge-promotion-batch-1.md](/c:/智能日志分析系统/next-app/docs/security-knowledge-promotion-batch-1.md)
- [supabase/phase-8b-security-knowledge-promotion-batch-1.sql](/c:/智能日志分析系统/next-app/supabase/phase-8b-security-knowledge-promotion-batch-1.sql)

## 解决的问题

1. 候选池已有 `311` 条，但主知识库没有吸收可复用的中文诊断案例
2. 主知识库英文条目较多，中文日志和中文提问下容易召回不稳
3. 候选池自动映射存在保守分类，需要在晋升时纠偏

## 结果

现在形成了“候选池分批晋升”的第一批标准做法：

- 先筛适合异常诊断的条目
- 再按主知识库口径显式分类
- 再落入 `knowledge_base`
- 最后回写候选池状态

这让候选池不再只是素材仓，而是开始稳定服务主 RAG 链路。
