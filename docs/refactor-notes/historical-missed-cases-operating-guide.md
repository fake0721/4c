# 历史漏报库运营指南 Refactor Notes

## 本轮目标

把 `historical_missed_cases` 从“结构存在、链路已接、但缺少运营闭环”的状态，推进到可以持续维护的正式知识层。

## 本轮新增

- [docs/historical-missed-cases-operating-guide.md](/c:/智能日志分析系统/next-app/docs/historical-missed-cases-operating-guide.md)

## 解决的问题

1. 漏报库虽然已经接入主 RAG，但缺少清晰运营口径
2. API 完成复核路径的沉淀条件偏弱，容易断链
3. 缺少历史 completed review 的回补机制
4. 缺少漏报库独立查询视图

## 结果

现在漏报库不再只是技术实现，而开始具备运营意义：

- 有入库标准
- 有回补动作
- 有独立查询能力
- 有与主知识库、运维经验库的边界定义
