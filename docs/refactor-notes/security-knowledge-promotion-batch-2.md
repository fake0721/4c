# 安全候选池第 2 批晋升 Refactor Notes

## 本轮目标

在不污染主知识库的前提下，继续吸收候选池中真正对诊断有价值的条目。

## 本轮新增

- [docs/security-knowledge-promotion-batch-2.md](/c:/智能日志分析系统/next-app/docs/security-knowledge-promotion-batch-2.md)
- [supabase/phase-8c-security-knowledge-promotion-batch-2.sql](/c:/智能日志分析系统/next-app/supabase/phase-8c-security-knowledge-promotion-batch-2.sql)

## 解决的问题

1. 主知识库对中文运行时别名的覆盖还不够
2. `configuration_error` 仍然偏少
3. 候选池中部分“中间件未授权暴露”案例虽有价值，但还没进入主链路

## 结果

这批晋升把候选池进一步转化成了可检索资产，但仍然保持边界：

- 只进可诊断、可处置的条目
- 不进泛化攻防素材
- 对自动映射偏差继续显式纠偏
